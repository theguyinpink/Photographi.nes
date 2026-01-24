import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function toNullableTrimmed(v: any): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function toPriceCents(body: any): number | null {
  // ✅ supporte soit price_cents direct, soit price en euros
  if (typeof body.price_cents === "number" && Number.isFinite(body.price_cents)) {
    return Math.round(body.price_cents);
  }
  if (typeof body.price === "number" && Number.isFinite(body.price)) {
    return Math.round(body.price * 100);
  }
  if (typeof body.price === "string" && body.price.trim().length) {
    const n = Number(body.price.replace(",", "."));
    if (Number.isFinite(n) && n > 0) return Math.round(n * 100);
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await context.params;

  const body = await req.json();
  const supabase = serviceSupabase();

  const price_cents = toPriceCents(body);

  const payload: Record<string, any> = {
    // champs principaux
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    price_cents: price_cents ?? undefined,
    currency: typeof body.currency === "string" ? body.currency.trim() : undefined,
    is_active: typeof body.is_active === "boolean" ? body.is_active : undefined,

    // metadata / filtres
    sport: body.sport === undefined ? undefined : toNullableTrimmed(body.sport),
    team: body.team === undefined ? undefined : toNullableTrimmed(body.team),
    category: body.category === undefined ? undefined : toNullableTrimmed(body.category),
    person: body.person === undefined ? undefined : toNullableTrimmed(body.person),

    // infos
    taken_at: body.taken_at === undefined ? undefined : (body.taken_at || null),
    description: body.description === undefined ? undefined : toNullableTrimmed(body.description),

    // ✅ IMPORTANT : pour l’upload direct storage → update DB
    image_url: body.image_url === undefined ? undefined : toNullableTrimmed(body.image_url),
  };

  // ✅ Retire les undefined pour ne pas écraser des champs existants
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  // garde-fou : au moins un champ à update
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ ok: true, updated: false });
  }

  const { error } = await supabase.from("products").update(payload).eq("id", id);

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true, updated: true });
}
