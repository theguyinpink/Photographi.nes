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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await context.params;

  const body = await req.json();
  const supabase = serviceSupabase();

  const payload = {
    title: body.title,
    price_cents: body.price_cents,
    is_active: body.is_active,
    sport: body.sport ?? null,
    team: body.team ?? null,
    person: body.person ?? null,
    taken_at: body.taken_at ?? null,
    description: body.description ?? null,
  };

  const { error } = await supabase.from("products").update(payload).eq("id", id);

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}
