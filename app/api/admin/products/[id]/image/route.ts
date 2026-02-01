import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function serviceSupabase() {
  return createClient(
    must("NEXT_PUBLIC_SUPABASE_URL"),
    must("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // ✅ éviter que requireAdmin déclenche un redirect => 500
  try {
    await requireAdmin();
  } catch (e: any) {
    const msg = String(e?.digest ?? e?.message ?? e ?? "");
    if (msg.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: msg || "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const body = await req.json().catch(() => null);
    const fileName = (body?.fileName as string | undefined)?.trim();
    const contentType = (body?.contentType as string | undefined)?.trim();

    if (!id) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName/contentType manquants" },
        { status: 400 }
      );
    }

    const supabase = serviceSupabase();

    // chemin final : previews/flip/<productId>/<timestamp>-<fileName>
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const path = `flip/${id}/${Date.now()}-${safeName}`;

    // ✅ Signed URL d'upload (empêche l’écrasement)
    const { data, error } = await supabase.storage
      .from("previews")
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message ?? "Signed upload url failed" },
        { status: 500 }
      );
    }

    const base = must("NEXT_PUBLIC_SUPABASE_URL");
    const publicUrl = `${base}/storage/v1/object/public/previews/${path}`;

    // ✅ on renvoie aussi les headers recommandés pour le PUT
    return NextResponse.json({
      signedUrl: data.signedUrl,
      path,
      publicUrl,
      putHeaders: {
        "content-type": contentType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
