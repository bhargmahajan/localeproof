import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { redis, getCoordCacheKey } from '@/lib/redis';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');
  const userId = searchParams.get('userId');
  const forceRefresh = searchParams.get('forceRefresh') === 'true';

  if (!latStr || !lngStr || !userId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  const { data: history, error: dbError } = await supabaseAdmin
    .from('user_history')
    .select('search_type, report_data, lat, lng')
    .eq('user_id', userId);
    
  if (dbError) console.error("Database Error:", dbError);

  if (history) {
    // Only return the free cached version if they didn't specifically ask to refresh it
    if (!forceRefresh) {
      const existingReport = history.find(h => 
        h.search_type === 'audit' && 
        Math.abs(h.lat - lat) < 0.001 && 
        Math.abs(h.lng - lng) < 0.001
      );

      if (existingReport) {
        return NextResponse.json({ source: 'history', report: existingReport.report_data });
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

  const cacheKey = getCoordCacheKey('audit', lat, lng);

  try {
    const cachedReport = await redis.get(cacheKey);
    if (cachedReport && !forceRefresh) {
      return NextResponse.json({ source: 'cache', report: cachedReport });
    }

    // --- RAG STEP: Fetch Live Data Before Asking AI ---
    let liveAqiContext = "Real-time AQI data currently unavailable. Estimate based on location.";
    try {
      // Using Open-Meteo Air Quality API (No API Key required)
      const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi`);
      if (aqiRes.ok) {
        const aqiData = await aqiRes.json();
        const currentAqi = aqiData.current?.us_aqi;
        if (currentAqi) {
          liveAqiContext = `The LIVE, real-time US AQI at this exact location right now is ${currentAqi}. Incorporate this fact directly into your environment assessment.`;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch live AQI:", e);
    }
    // ---------------------------------------------------

    const prompt = `
      Act as an expert Global real estate data analyst. Analyze the geographic area at coordinates: Latitude ${lat}, Longitude ${lng}. 
      Identify the city and specific neighborhood. Then, estimate parameters based on current urban realities.

      CONTEXT INJECTION: ${liveAqiContext}
      
      Respond STRICTLY in JSON format with the following schema:
      {
        "neighborhoodName": "string",
        "overallScore": number (0-100),
        "executiveSummary": "string (2-3 sentences summarizing livability)",
        "utilities": { "waterAvailability": "string", "powerOutageFrequency": "string" },
        "environment": { "aqiAverage": "string", "monsoonVulnerability": "string" },
        "services": { "ecommerce": "string", "quickCommerce": "string", "rideHailing": "string" },
        "security": { "crimeIndex": "string (e.g., Low, Moderate, High with 1 sentence context)" },
        "development": { "futureInfrastructure": "string (mention upcoming transit, roads, or commercial projects if any)" }
      }
    `;

    let reportData = null;
    let retries = 3;
    let delay = 1000;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash', 
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        if (response.text) {
          reportData = JSON.parse(response.text);
          break; 
        }
      } catch (err: any) {
        if (err.status === 503 || err.status === 429) {
          if (i === retries - 1) throw new Error("AI engine at peak capacity.");
          await new Promise(res => setTimeout(res, delay));
          delay *= 2; 
        } else {
          throw err;
        }
      }
    }

    if (!reportData) throw new Error("Failed to parse the neighborhood assessment.");
    await redis.set(cacheKey, reportData, { ex: 604800 });
    return NextResponse.json({ source: 'ai', report: reportData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate audit' }, { status: 500 });
  }
}