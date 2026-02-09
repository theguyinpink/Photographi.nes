import { NextResponse } from "next/server";
import Stripe from "stripe";
import { calculateTotalPriceCents } from "@/lib/pricing";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // si tu veux verrouiller la version d’API Stripe :
  // apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type CheckoutItem = { id: string; qty: number };

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

type DbOrder = {
  id: string;
  status: string | null;
  stripe_session_id: string | null;
  checkout_id: string | null;
  total_cents: number | null;
  currency: string | null;
  photo_count: number | null;
  items: CheckoutItem[] | null;
};

async function buildStripeSessionFromOrder(order: DbOrder) {
  const orderId = order.id;
  const currency = (order.currency ?? "eur").toLowerCase();
  const photoCount = Math.max(0, Number(order.photo_count ?? 0));
  const totalCents = Math.max(0, Number(order.total_cents ?? 0));

  if (!photoCount || !totalCents) {
    throw new Error("Commande invalide (photo_count/total_cents manquants).");
  }

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
      metadata: {
        order_id: orderId,
        // utile pour debug si un jour tu dois prouver ce qui a été facturé
        photo_count: String(photoCount),
        total_cents: String(totalCents),
      },
      client_reference_id: orderId,
      success_url: `${must("NEXT_PUBLIC_SITE_URL")}/success?order_id=${orderId}`,
      cancel_url: `${must("NEXT_PUBLIC_SITE_URL")}/cart`,
    },
    // idempotency key sur checkout_id = même session si Stripe a déjà créé
    { idempotencyKey: `checkout_${order.checkout_id ?? orderId}` }
  );

  return session;
}

export async function POST(req: Request) {
  try {
    must("STRIPE_SECRET_KEY");
    must("NEXT_PUBLIC_SUPABASE_URL");
    must("SUPABASE_SERVICE_ROLE_KEY");
    must("NEXT_PUBLIC_SITE_URL");

    const body = await req.json().catch(() => ({}));

    const checkoutId: string = String(body.checkout_id || "").trim();
    if (!checkoutId) {
      return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });
    }

    // items viennent du client : on les accepte UNIQUEMENT si on crée une nouvelle commande
    const items: CheckoutItem[] = Array.isArray(body.items) ? body.items : [];
    const photoCountFromBody = items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

    if (photoCountFromBody <= 0) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    const totalCentsFromBody = calculateTotalPriceCents(photoCountFromBody);
    const currency = "eur";

    // 1) Si une commande existe déjà pour ce checkout_id, on l’utilise comme vérité (DB > body)
    const { data: existingOrder, error: existingErr } = await supabaseAdmin
      .from("orders")
      .select("id,status,stripe_session_id,checkout_id,total_cents,currency,photo_count,items")
      .eq("checkout_id", checkoutId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<DbOrder>();

    if (existingErr) {
      console.error("Supabase read existing order error:", existingErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // déjà payée => success direct
    if (existingOrder?.status === "PAID") {
      return NextResponse.json({
        ok: true,
        alreadyPaid: true,
        orderId: existingOrder.id,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?order_id=${existingOrder.id}`,
      });
    }

    // déjà une session Stripe => on renvoie l’URL (et surtout on NE RECALCULE PAS)
    if (existingOrder?.stripe_session_id) {
      const session = await stripe.checkout.sessions.retrieve(existingOrder.stripe_session_id);
      if (session?.url) return NextResponse.json({ url: session.url });
      // si session récupérable mais sans url (rare) => on continue pour recréer
    }

    // 2) Sinon on tente de créer la commande
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        checkout_id: checkoutId,
        status: "PENDING",
        total_cents: totalCentsFromBody,
        currency,
        items,
        photo_count: photoCountFromBody,
      })
      .select("id,status,stripe_session_id,checkout_id,total_cents,currency,photo_count,items")
      .single<DbOrder>();

    // 23505 => commande déjà créée en parallèle -> on RECHARGE et on utilise la DB (pas le body)
    if (orderErr) {
      if ((orderErr as any)?.code === "23505") {
        const { data: o2, error: readErr } = await supabaseAdmin
          .from("orders")
          .select("id,status,stripe_session_id,checkout_id,total_cents,currency,photo_count,items")
          .eq("checkout_id", checkoutId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single<DbOrder>();

        if (readErr || !o2) {
          console.error("Supabase reload order after 23505 error:", readErr);
          return NextResponse.json({ error: "DB conflict reload failed" }, { status: 500 });
        }

        // si une session existe -> renvoyer
        if (o2.stripe_session_id) {
          const session = await stripe.checkout.sessions.retrieve(o2.stripe_session_id);
          if (session?.url) return NextResponse.json({ url: session.url });
        }

        // sinon -> créer session à partir de o2 (DB truth)
        const session = await buildStripeSessionFromOrder(o2);

        await supabaseAdmin
          .from("orders")
          .update({ stripe_session_id: session.id })
          .eq("id", o2.id);

        return NextResponse.json({ url: session.url });
      }

      console.error("Supabase insert order error:", orderErr);
      return NextResponse.json(
        { error: "Supabase order insert failed", details: orderErr },
        { status: 500 }
      );
    }

    // 3) Créer la session Stripe à partir de la commande DB (et pas du body)
    const session = await buildStripeSessionFromOrder(order);

    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

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
