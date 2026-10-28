import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bundle = body.bundle || 'single';
    const amount = bundle === 'shortlist' ? 14900 : 4900; // ₹149 or ₹49 in paise

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: 'receipt_' + Math.random().toString(36).substring(7),
    });
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}