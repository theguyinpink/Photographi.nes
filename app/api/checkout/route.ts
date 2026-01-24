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
    const checkoutId: string | undefined = body.checkout_id;

    if (!checkoutId) {
      return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });
    }

    const photoCount = items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    if (photoCount <= 0) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    const totalCents = calculateTotalPriceCents(photoCount);
    const currency = "eur";

    // 1) UPSERT order (anti-doublon, même si POST multiple)
    const { error: upsertErr } = await supabaseAdmin
      .from("orders")
      .upsert(
        {
          id: checkoutId,                 // ✅ ID stable
          status: "PENDING",
          total_cents: totalCents,
          currency,
          items,
          photo_count: photoCount,
        },
        { onConflict: "id" }
      );

    if (upsertErr) {
      console.error("Supabase upsert order error:", upsertErr);
      return NextResponse.json(
        { error: "Supabase order upsert failed", details: upsertErr },
        { status: 500 }
      );
    }

    // 2) Create Stripe session avec idempotencyKey = checkoutId (anti-double session aussi)
    const session = await stripe.checkout.sessions.create(
      {
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
        // ✅ Stripe collectera l'email de l’acheteur, dispo dans webhook: session.customer_details.email
        metadata: { order_id: checkoutId },
        client_reference_id: checkoutId,

        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?order_id=${checkoutId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
      },
      { idempotencyKey: checkoutId }
    );

    // 3) Update order stripe_session_id (et on ne casse pas si retry)
    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", checkoutId);

    if (updErr) console.error("Supabase update stripe_session_id error:", updErr);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Checkout crashed", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
