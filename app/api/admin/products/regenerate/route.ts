import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const supabase = serviceSupabase();

  // Optionnel: limiter pour éviter timeout Vercel
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "25");

  const { data: products, error } = await supabase
    .from("products")
    .select("id, original_path, thumbnail_url, flipagram_url")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return new NextResponse(error.message, { status: 400 });
  if (!products?.length) return NextResponse.json({ updated: 0, skipped: 0 });

  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    // On ne peut regénérer proprement QUE si on a l'original privé
    if (!p.original_path) {
      skipped++;
      continue;
    }

    // appelle ta route generate existante en interne (même logique, pas de duplication)
    // On reconstruit une URL locale relative (fonctionne sur Vercel)
    const genUrl = new URL(`/api/admin/products/${p.id}/generate`, req.url);

    const r = await fetch(genUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ original_path: p.original_path }),
      cache: "no-store",
    });

    if (r.ok) updated++;
    else skipped++;
  }

  return NextResponse.json({ updated, skipped });
}
