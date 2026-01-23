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

export async function GET() {
  await requireAdmin();
  const supabase = serviceSupabase();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const supabase = serviceSupabase();

  const body = await req.json();

  const { data, error } = await supabase
    .from("products")
    .insert({
      title: body.title ?? "Nouveau produit",
      price_cents: body.price_cents ?? 0,
      is_active: body.is_active ?? false,
      description: body.description ?? null,
      sport: body.sport ?? null,
      team: body.team ?? null,
      person: body.person ?? null,
      taken_at: body.taken_at ?? null,
    })
    .select("id")
    .single();

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ id: data.id });
}
