import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const secret = process.env.RAZORPAY_KEY_SECRET!;

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.razorpay_order_id + '|' + body.razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== body.razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Assign 5 credits for bundle, 1 for single
    const bundle = body.bundle || 'single';
    const credits = bundle === 'shortlist' ? 5 : 1;

    // 2. Log as a generic payment to the unified pool
    const { error: dbError } = await supabaseAdmin.from('user_history').insert([{
      user_id: body.userId,
      search_type: 'payment',
      lat: 0,
      lng: 0,
      report_data: { 
        type: 'pool',
        credits: credits 
      }
    }]);

    if (dbError) {
      console.error("Payment logging error:", dbError);
      throw new Error("Failed to log payment to database.");
    }

    return NextResponse.json({ success: true, credits });
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: 'Payment verification failed due to an internal server error.' }, { status: 500 });
  }
}