import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function eurosToCents(value: any) {
  const n = Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const supabase = serviceSupabase();

  const body = await req.json();

  const { data, error } = await supabase
    .from("products")
    .insert({
      title: body.title ?? "Sans titre",
      price_cents: eurosToCents(body.price),
      is_active: body.is_active ?? true,
      description: body.description ?? null,
      sport: body.sport ?? null,
      team: body.team ?? null,
      person: body.person ?? null,
      taken_at: body.taken_at ?? null,
      image_url: null,
      currency: body.currency ?? "EUR",
    })
    .select("id")
    .single();

  if (error) return new NextResponse(error.message, { status: 400 });

  return NextResponse.json({ id: data.id });
}
