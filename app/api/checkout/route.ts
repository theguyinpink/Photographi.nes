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

    const checkoutId: string = String(body.checkout_id || "").trim();
    if (!checkoutId) {
      return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });
    }

    const items: CheckoutItem[] = Array.isArray(body.items) ? body.items : [];
    const photoCount = items.reduce((sum, i) => sum + (i.qty ?? 0), 0);

    if (photoCount <= 0) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    const totalCents = calculateTotalPriceCents(photoCount);
    const currency = "eur";

    // 1) Si une commande existe déjà pour ce checkout_id, on la réutilise
    const { data: existingOrder, error: existingErr } = await supabaseAdmin
      .from("orders")
      .select("id,status,stripe_session_id")
      .eq("checkout_id", checkoutId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingErr) {
      console.error("Supabase read existing order error:", existingErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // Si déjà payée → on peut renvoyer success direct
    if (existingOrder?.status === "PAID") {
      return NextResponse.json({
        ok: true,
        alreadyPaid: true,
        orderId: existingOrder.id,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?order_id=${existingOrder.id}`,
      });
    }

    // Si une session Stripe existe déjà, on renvoie son URL
    if (existingOrder?.stripe_session_id) {
      const session = await stripe.checkout.sessions.retrieve(existingOrder.stripe_session_id);
      if (session?.url) return NextResponse.json({ url: session.url });

      // si pas d’url (rare) → on continue et on en recrée une
    }

    // 2) Sinon, créer la commande (avec checkout_id unique)
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        checkout_id: checkoutId,
        status: "PENDING",
        total_cents: totalCents,
        currency,
        items,
        photo_count: photoCount,
      })
      .select("id")
      .single();

    // Si conflit unique (checkout_id déjà là) → on relit la commande existante
    if (orderErr) {
      // 23505 = unique_violation (Postgres)
      if ((orderErr as any)?.code === "23505") {
        const { data: o2 } = await supabaseAdmin
          .from("orders")
          .select("id,stripe_session_id,status")
          .eq("checkout_id", checkoutId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (o2?.stripe_session_id) {
          const session = await stripe.checkout.sessions.retrieve(o2.stripe_session_id);
          if (session?.url) return NextResponse.json({ url: session.url });
        }

        // sinon on retombe sur une création de session plus bas
        // en utilisant o2.id
        const orderId = o2?.id as string;
        const session = await stripe.checkout.sessions.create(
          {
            mode: "payment",
            payment_method_types: ["card"],
            customer_creation: "always",
            billing_address_collection: "auto",
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
          },
          { idempotencyKey: `checkout_${checkoutId}` }
        );

        await supabaseAdmin
          .from("orders")
          .update({ stripe_session_id: session.id })
          .eq("id", orderId);

        return NextResponse.json({ url: session.url });
      }

      console.error("Supabase insert order error:", orderErr);
      return NextResponse.json({ error: "Supabase order insert failed", details: orderErr }, { status: 500 });
    }

    const orderId = order.id as string;

    // 3) créer la session Stripe (idempotent via checkout_id)
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        customer_creation: "always",
        billing_address_collection: "auto",
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
      },
      { idempotencyKey: `checkout_${checkoutId}` }
    );

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
