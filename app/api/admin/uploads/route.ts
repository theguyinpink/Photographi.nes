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

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-");
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const form = await req.formData();
  const thumbnail = form.get("thumbnail");
  const flipagram = form.get("flipagram");

  if (!(thumbnail instanceof Blob) || !(flipagram instanceof Blob)) {
    return new NextResponse("Missing files (thumbnail + flipagram)", { status: 400 });
  }

  const supabase = serviceSupabase();
  const now = Date.now();

  const thumbPath = `thumbnails/${now}-${safeFileName((thumbnail as any).name ?? "thumb.jpg")}`;
  const flipPath = `flip/${now}-${safeFileName((flipagram as any).name ?? "flip.jpg")}`;

  // upload thumbnail
  {
    const bytes = new Uint8Array(await thumbnail.arrayBuffer());
    const { error } = await supabase.storage
      .from("public-images")
      .upload(thumbPath, new Blob([bytes], { type: thumbnail.type || "image/jpeg" }), {
        upsert: true,
        contentType: thumbnail.type || "image/jpeg",
      });

    if (error) return new NextResponse(error.message, { status: 400 });
  }

  // upload flipagram
  {
    const bytes = new Uint8Array(await flipagram.arrayBuffer());
    const { error } = await supabase.storage
      .from("previews")
      .upload(flipPath, new Blob([bytes], { type: flipagram.type || "image/jpeg" }), {
        upsert: true,
        contentType: flipagram.type || "image/jpeg",
      });

    if (error) return new NextResponse(error.message, { status: 400 });
  }

  const thumbnail_url = supabase.storage.from("public-images").getPublicUrl(thumbPath).data.publicUrl;
  const flipagram_url = supabase.storage.from("previews").getPublicUrl(flipPath).data.publicUrl;

  return NextResponse.json({ thumbnail_url, flipagram_url });
}
