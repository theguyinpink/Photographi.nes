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
  // accepte "8", "8.00", 8, etc.
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
      price_cents: eurosToCents(body.price), // ✅ conversion ici
      is_active: body.is_active ?? true,     // ✅ par défaut true (modifiable)
      description: body.description ?? null,
      sport: body.sport ?? null,
      team: body.team ?? null,
      person: body.person ?? null,
      taken_at: body.taken_at ?? null,
      image_url: null, // ✅ sera rempli après upload via /image
    })
    .select("id")
    .single();

  if (error) return new NextResponse(error.message, { status: 400 });

  return NextResponse.json({ id: data.id });
}