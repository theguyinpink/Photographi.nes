// app/api/admin/products/[id]/image/route.ts
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

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-");
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ Next 16
) {
  await requireAdmin();

  const { id } = await context.params;

  // 🔎 env guard (utile sur Vercel)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL manquant" },
      { status: 500 }
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY manquant (Vercel env vars)" },
      { status: 500 }
    );
  }

  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("image");

  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing field 'image' (FormData)" },
      { status: 400 }
    );
  }

  const supabase = serviceSupabase();

  // ✅ bucket + chemin => tu verras l'upload dans previews/flip/...
  const bucket = "previews";
  const originalName = (file as any).name ?? "image.jpg";
  const contentType = (file as any).type || "image/jpeg";

  const path = `flip/${id}/${Date.now()}-${safeFileName(originalName)}`;

  // ✅ upload direct du Blob (simple et fiable)
  const { data: upData, error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType,
    });

  if (upErr) {
    return NextResponse.json(
      {
        error: "Upload storage échoué",
        details: upErr.message,
        bucket,
        path,
        contentType,
      },
      { status: 400 }
    );
  }

  // 🔎 preuve : on liste le dossier flip/<id> juste après upload
  const { data: listed, error: listErr } = await supabase.storage
    .from(bucket)
    .list(`flip/${id}`, {
      limit: 10,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (listErr) {
    return NextResponse.json(
      {
        error: "Upload OK mais list() échoué",
        details: listErr.message,
        bucket,
        path,
        uploaded: upData,
      },
      { status: 400 }
    );
  }

  // 🔗 URL publique (le bucket doit être public pour affichage visiteur)
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  const image_url = pub.publicUrl;

  // ✅ update DB
  const { error: dbErr } = await supabase
    .from("products")
    .update({ image_url })
    .eq("id", id);

  if (dbErr) {
    return NextResponse.json(
      {
        error: "Update DB échoué",
        details: dbErr.message,
        image_url,
        bucket,
        path,
        listed,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    id,
    image_url,
    bucket,
    path,
    uploaded: upData,
    listed,
  });
}
