import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.title || !body.price_cents) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  await supabaseServer.from("products").insert({
    title: body.title,
    price_cents: body.price_cents,
    currency: "EUR",
    is_active: true,
  });

  return NextResponse.json({ ok: true });
}
