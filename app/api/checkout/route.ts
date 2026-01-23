import { NextResponse } from "next/server";
import Stripe from "stripe";
import { calculateTotalPriceCents } from "@/lib/pricing";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 🔒 Service role: serveur uniquement
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type CheckoutItem = { id: string; qty: number };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: CheckoutItem[] = Array.isArray(body.items) ? body.items : [];

    const photoCount = items.reduce((sum, i) => sum + (i.qty ?? 0), 0);
    if (photoCount <= 0) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    // ✅ total bundle en centimes
    const totalCents = calculateTotalPriceCents(photoCount);
    const currency = "eur";

    // 1) ✅ crée la commande en DB
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        status: "pending",
        total_cents: totalCents,
        currency,
        items,         // jsonb
        photo_count: photoCount,
      })
      .select("id")
      .single();

    if (orderErr || !order?.id) {
      console.error(orderErr);
      return NextResponse.json({ error: "Erreur création commande" }, { status: 500 });
    }

    const orderId = order.id as string;

    // 2) ✅ crée la session Stripe, on attache l’order_id
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `${photoCount} photo(s) PhotographI.nes`,
            },
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

    // 3) ✅ sauvegarde l'id de session Stripe dans la commande
    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", orderId);

    if (updErr) console.error("Order update error:", updErr);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Erreur checkout" }, { status: 500 });
  }
}
