import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: history, error } = await supabaseAdmin
    .from('user_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Unified Pool Logic: Sum all usages across both features
  const totalUsages = history.filter(h => h.search_type === 'audit' || h.search_type === 'commute').length;
  
  // Sum all purchased credits regardless of what button they clicked originally
  const payments = history.filter(h => h.search_type === 'payment');
  const totalPaidCredits = payments.reduce((sum, p) => sum + (p.report_data?.credits || 1), 0);
  
  const totalAvailable = 2 + totalPaidCredits; // 2 free reports + paid pool

  const reports = history.filter(h => h.search_type === 'audit' || h.search_type === 'commute');

  return NextResponse.json({
    quotas: {
      total: totalAvailable,
      used: totalUsages,
      remaining: Math.max(0, totalAvailable - totalUsages)
    },
    reports
  });
}