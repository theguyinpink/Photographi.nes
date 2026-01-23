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
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await context.params;

  const form = await req.formData();
  const file = form.get("image");

  if (!(file instanceof Blob)) {
    return new NextResponse("Missing image file", { status: 400 });
  }

  const supabase = serviceSupabase();
  const now = Date.now();
  const filename = safeFileName((file as any).name ?? "image.jpg");
  const path = `products/${id}/${now}-${filename}`;

  // bucket public conseillé: "previews" (tu peux changer le nom si tu as un autre bucket)
  const bucket = "previews";

  const { error: upErr } = await supabase.storage.from(bucket).upload(
    path,
    file,
    {
      upsert: true,
      contentType: file.type || "image/jpeg",
    }
  );

  if (upErr) return new NextResponse(upErr.message, { status: 400 });

  const image_url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

  const { error: dbErr } = await supabase
  .from("products")
  .update({ image_url })
  .eq("id", id);

  if (dbErr) return new NextResponse(dbErr.message, { status: 400 });

  return NextResponse.json({ image_url, path });
}
