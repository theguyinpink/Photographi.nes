import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Invalid signature" }, { status: 400 });
  }

  const markPaid = async (session: Stripe.Checkout.Session) => {
    const orderId = session.metadata?.order_id;

    const email =
      session.customer_details?.email ??
      session.customer_email ??
      null;

    if (!orderId) return;

    // ✅ évite de repasser 10 fois la commande en PAID si Stripe renvoie l’event
    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        status: "PAID",
        email,
      })
      .eq("id", orderId)
      .eq("status", "PENDING");

    if (error) {
      console.error("Supabase update order error:", error);
      // si tu veux que Stripe retente, tu peux renvoyer 500
      return;
    }
  };

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await markPaid(session);
  }

  // optionnel mais “safe”
  if (event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    await markPaid(session);
  }

  return NextResponse.json({ received: true });
}
