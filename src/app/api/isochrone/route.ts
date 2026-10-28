import { NextResponse } from 'next/server';
import { redis, getCoordCacheKey } from '@/lib/redis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: 'Missing lat or lng parameters' }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  const cacheKey = getCoordCacheKey('isochrone', lat, lng);

  try {
    // 1. Check Upstash Redis cache first (Saves your ORS API daily limits)
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({ source: 'cache', data: cachedData });
    }

    // 2. If not cached, call OpenRouteService API
    const orsResponse = await fetch('https://api.openrouteservice.org/v2/isochrones/foot-walking', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ORS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locations: [[lng, lat]], // ORS expects [longitude, latitude]
        range: [300, 600, 900],  // 5 mins (300s), 10 mins (600s), 15 mins (900s)
        range_type: 'time',
      }),
    });

    if (!orsResponse.ok) {
      const errorText = await orsResponse.text();
      return NextResponse.json({ error: `ORS Error: ${errorText}` }, { status: orsResponse.status });
    }

    const data = await orsResponse.json();

    // 3. Cache the GeoJSON response in Redis for 24 hours (86400 seconds)
    await redis.set(cacheKey, data, { ex: 86400 });

    return NextResponse.json({ source: 'api', data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}