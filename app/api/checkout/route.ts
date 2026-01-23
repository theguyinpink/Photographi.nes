import { NextResponse } from "next/server";
import Stripe from "stripe";
import { calculateTotalPriceCents } from "@/lib/pricing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});


export async function POST(req: Request) {
  try {
    const body = await req.json();

    /**
     * On attend juste le panier :
     * items: [{ id, qty }]
     * Le prix est recalculé ici, pas envoyé par le client
     */
    const items: { id: string; qty: number }[] = body.items ?? [];

    // nombre total de photos
    const photoCount = items.reduce((sum, i) => sum + i.qty, 0);

    if (photoCount <= 0) {
      return NextResponse.json(
        { error: "Panier vide" },
        { status: 400 }
      );
    }

    // ✅ PRIX OFFICIEL (bundle)
    const amount = calculateTotalPriceCents(photoCount);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${photoCount} photo(s) PhotographI.nes`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Erreur Stripe" },
      { status: 500 }
    );
  }
}
