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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await context.params;

  const body = await req.json().catch(() => null);
  const fileName = body?.fileName as string | undefined;
  const contentType = body?.contentType as string | undefined;

  if (!fileName || !contentType) {
    return NextResponse.json(
      { error: "fileName/contentType manquants" },
      { status: 400 }
    );
  }

  const supabase = serviceSupabase();

  // chemin final : previews/flip/<productId>/<timestamp>-<fileName>
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `flip/${id}/${Date.now()}-${safeName}`;

  // ✅ Signed URL d'upload
  const { data, error } = await supabase.storage
    .from("previews")
    .createSignedUploadUrl(path);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Signed upload url failed", details: error },
      { status: 500 }
    );
  }

  // URL publique (bucket public)
  const publicUrl =
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}` +
    `/storage/v1/object/public/previews/${path}`;

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path,
    publicUrl,
  });
}
