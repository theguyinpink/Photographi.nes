import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
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

function makeWatermarkSVG(text: string) {
  const svg = `
  <svg width="1400" height="900" xmlns="http://www.w3.org/2000/svg">
    <style>
      .t { fill: rgba(255,255,255,0.22); font-size: 28px; font-family: Arial; letter-spacing: 2px; }
    </style>
    <g transform="rotate(-20 700 450)">
      ${Array.from({ length: 22 })
        .map((_, i) => {
          const y = 40 + i * 42;
          return `<text x="-120" y="${y}" class="t">${text} · ${text} · ${text} · ${text}</text>`;
        })
        .join("")}
    </g>
  </svg>`;
  return Buffer.from(svg);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ params est une Promise en Next 16
) {
  await requireAdmin();

  const { id } = await context.params; // ✅ await ici

  const form = await req.formData();
  const original = form.get("original");

  if (!(original instanceof Blob)) {
    return new NextResponse("Missing original file", { status: 400 });
  }

  const inputBuffer = Buffer.from(await original.arrayBuffer());
  const supabase = serviceSupabase();
  const now = Date.now();

  const originalPath = `originals/${id}/${now}-${safeFileName(
    (original as any).name ?? "original.jpg"
  )}`;

  // upload original (private)
  {
    const { error } = await supabase.storage
      .from("originals")
      .upload(
        originalPath,
        new Blob([new Uint8Array(inputBuffer)], {
          type: original.type || "image/jpeg",
        }),
        {
          upsert: true,
          contentType: original.type || "image/jpeg",
        }
      );

    if (error) return new NextResponse(error.message, { status: 400 });
  }

  // thumbnail
  const thumbBuf = await sharp(inputBuffer)
    .resize({ width: 900, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  const thumbPath = `thumbnails/${id}/${now}-thumb.jpg`;

  {
    const { error } = await supabase.storage
      .from("public-images")
      .upload(
        thumbPath,
        new Blob([new Uint8Array(thumbBuf)], { type: "image/jpeg" }),
        { upsert: true, contentType: "image/jpeg" }
      );

    if (error) return new NextResponse(error.message, { status: 400 });
  }

  // flipagram (watermark)
  const wm = makeWatermarkSVG("photographi.nes");
  const flipBuf = await sharp(inputBuffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .composite([{ input: wm }])
    .jpeg({ quality: 80 })
    .toBuffer();

  const flipPath = `flip/${id}/${now}-flip.jpg`;

  {
    const { error } = await supabase.storage
      .from("previews")
      .upload(
        flipPath,
        new Blob([new Uint8Array(flipBuf)], { type: "image/jpeg" }),
        { upsert: true, contentType: "image/jpeg" }
      );

    if (error) return new NextResponse(error.message, { status: 400 });
  }

  const thumbnail_url = supabase.storage
    .from("public-images")
    .getPublicUrl(thumbPath).data.publicUrl;

  const flipagram_url = supabase.storage
    .from("previews")
    .getPublicUrl(flipPath).data.publicUrl;

  const { error: updErr } = await supabase
    .from("products")
    .update({ thumbnail_url, flipagram_url, original_path: originalPath })
    .eq("id", id);

  if (updErr) return new NextResponse(updErr.message, { status: 400 });

  return NextResponse.json({ thumbnail_url, flipagram_url, original_path: originalPath });
}
