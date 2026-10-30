import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis, getCoordCacheKey } from '@/lib/redis';

const ORS_API_KEY = process.env.ORS_API_KEY!;

// Mathematical formula to calculate straight-line distance on a sphere (Earth)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius in meters
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getCategoryTags = (category: string) => {
  switch (category) {
    case 'transit': return '["public_transport"~"station|platform|stop_area"]';
    case 'bus': return '["highway"="bus_stop"]';
    case 'school': return '["amenity"~"school|kindergarten|college|university"]';
    case 'hospital': return '["amenity"~"hospital|clinic|doctors|dentist"]';
    case 'park': return '["leisure"~"park|playground|garden"]';
    case 'grocery': return '["shop"~"supermarket|convenience|greengrocer|bakery"]';
    case 'pharmacy': return '["amenity"="pharmacy"]';
    case 'worship': return '["amenity"="place_of_worship"]';
    case 'gym': return '["leisure"="fitness_centre"]';
    case 'bank': return '["amenity"~"bank|atm"]';
    case 'restaurant': return '["amenity"~"restaurant|cafe|fast_food"]';
    default: 
      throw new Error(`Invalid service category: "${category}".`);
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('startLat');
  const lngStr = searchParams.get('startLng');
  const category = searchParams.get('category') || 'transit';
  const claimedMinutesStr = searchParams.get('claimedMinutes');
  const userId = searchParams.get('userId');
  const forceRefresh = searchParams.get('forceRefresh') === 'true';

  if (!latStr || !lngStr || !claimedMinutesStr || !userId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const rawLat = parseFloat(latStr);
  const rawLng = parseFloat(lngStr);
  const startLat = Math.round(rawLat * 1000) / 1000;
  const startLng = Math.round(rawLng * 1000) / 1000;
  const claimedMinutes = parseInt(claimedMinutesStr, 10);

  if ( isNaN(startLat) || startLat < -90 || startLat > 90 || isNaN(startLng) || startLng < -180 || startLng > 180 ) {
    return NextResponse.json({ error: "Invalid coordinate or radius parameters." }, { status: 400 });
  }

  const { data: history, error: dbError } = await supabaseAdmin
    .from('user_history')
    .select('search_type, report_data, lat, lng')
    .eq('user_id', userId);

  if (dbError) console.error("Database Error:", dbError);

  if (history) {
    if (!forceRefresh) {
      const existingCommute = history.find(h => 
        h.search_type === 'commute' &&
        h.report_data?.category === category &&
        Math.abs(h.lat - startLat) < 0.001 && 
        Math.abs(h.lng - startLng) < 0.001
      );

      if (existingCommute) {
        const cachedData = existingCommute.report_data;
        cachedData.claimedMinutes = claimedMinutes; 
        cachedData.isExaggerated = cachedData.realisticPeakMinutes > claimedMinutes;
        return NextResponse.json(cachedData);
      }
    }

    // Unified Limit Check: Count total usages across the entire app
    const totalUsages = history.filter(h => h.search_type === 'audit' || h.search_type === 'commute').length;
    const payments = history.filter(h => h.search_type === 'payment');
    const totalPaidCredits = payments.reduce((sum, p) => sum + (p.report_data?.credits || 1), 0);
    
    if (totalUsages >= 2 + totalPaidCredits) {
      return NextResponse.json({ paymentRequired: true });
    }
  }
  
  const cacheKey = getCoordCacheKey(`commute_${category}`, startLat, startLng);

  try {
    // Overpass Request
    const tags = getCategoryTags(category);
    const radius = 2000;
    
    // Add [timeout:10] to prevent the 12-second server hanging
    const overpassQuery = `
      [out:json][timeout:10];
      (
        node${tags}(around:${radius},${startLat},${startLng});
        way${tags}(around:${radius},${startLat},${startLng});
        relation${tags}(around:${radius},${startLat},${startLng});
      );
      out center;
    `;

    const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'LocaleProofApp/1.0'
      },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });

    if (!overpassRes.ok) throw new Error(`Mapping service busy (${overpassRes.status}).`);
    const overpassData = await overpassRes.json();
    if (!overpassData.elements || overpassData.elements.length === 0) throw new Error(`No ${category} found within a 2km radius.`);

    // Calculate actual closest facility mathematically
    let nearestFacility = overpassData.elements[0];
    let minDistance = Infinity;

    for (const el of overpassData.elements) {
      const elLat = el.lat || el.center?.lat;
      const elLng = el.lon || el.center?.lon;
      
      if (elLat && elLng) {
        const dist = getDistance(startLat, startLng, elLat, elLng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestFacility = el;
        }
      }
    }

    const destLat = nearestFacility.lat || nearestFacility.center?.lat;
    const destLng = nearestFacility.lon || nearestFacility.center?.lon;
    const facilityName = nearestFacility.tags?.name || `Unnamed ${category}`;

    const orsRes = await fetch(
      `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${ORS_API_KEY}&start=${startLng},${startLat}&end=${destLng},${destLat}`
    );
    
    if (!orsRes.ok) throw new Error(`Routing engine failed (${orsRes.status}).`);
    
    const orsData = await orsRes.json();
    const route = orsData.features[0];
    const rawDurationSeconds = route.properties.summary.duration;
    const realisticPeakMinutes = Math.ceil((rawDurationSeconds * 1.25) / 60);

    const result = {
      nearestName: facilityName,
      destinationCoords: { lat: destLat, lng: destLng },
      claimedMinutes,
      realisticPeakMinutes,
      isExaggerated: realisticPeakMinutes > claimedMinutes,
      routeGeoJson: route.geometry,
      category // Save category in output to ensure dashboard consistency
    };

    await redis.set(cacheKey, result, { ex: 604800 });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Commute Verification Error:", err);
    
    // Preserve custom, safe "Not Found" messages
    const isNotFound = err.message?.includes('No ') && err.message?.includes('found');
    const statusCode = isNotFound ? 404 : 500;
    
    // Sanitize 500 errors to prevent leaking API failures or stack traces
    const safeMessage = isNotFound 
      ? err.message 
      : "Failed to verify commute due to an internal server error.";
    
    return NextResponse.json({ error: safeMessage }, { status: statusCode });
  }
}