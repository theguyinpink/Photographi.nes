import { NextResponse } from "next/server";
import Stripe from "stripe";
import { calculateTotalPriceCents } from "@/lib/pricing";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type CheckoutItem = { id: string; qty: number };

export async function POST(req: Request) {
  try {
    // ✅ check env
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_SITE_URL" }, { status: 500 });
    }

    const body = await req.json();
    const items: CheckoutItem[] = Array.isArray(body.items) ? body.items : [];

    const photoCount = items.reduce((sum, i) => sum + (i.qty ?? 0), 0);
    if (photoCount <= 0) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    const totalCents = calculateTotalPriceCents(photoCount);
    const currency = "eur";

    // ✅ insert order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        status: "PENDING",
        total_cents: totalCents,
        currency,
        items,
        photo_count: photoCount,
      })
      .select("id")
      .single();

    if (orderErr || !order?.id) {
      console.error("Supabase insert order error:", orderErr);
      return NextResponse.json(
        { error: "Supabase order insert failed", details: orderErr },
        { status: 500 }
      );
    }

    const orderId = order.id as string;

    // ✅ create stripe session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: `${photoCount} photo(s) PhotographI.nes` },
            unit_amount: totalCents,
          },
          quantity: 1,
        },
      ],
      metadata: { order_id: orderId },
      client_reference_id: orderId,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?order_id=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
    });

    // ✅ update stripe_session_id
    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", orderId);

    if (updErr) console.error("Supabase update order error:", updErr);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Checkout crashed", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
