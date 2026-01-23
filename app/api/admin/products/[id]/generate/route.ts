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

function makeWatermarkSVG(repeatText: string) {
  // watermark texte répété (propre, léger)
  const svg = `
  <svg width="1400" height="900" xmlns="http://www.w3.org/2000/svg">
    <style>
      .t { fill: rgba(255,255,255,0.18); font-size: 28px; font-family: Arial; letter-spacing: 2px; }
    </style>
    <g transform="rotate(-20 700 450)">
      ${Array.from({ length: 22 }).map((_, i) => {
        const y = 50 + i * 42;
        return `<text x="-160" y="${y}" class="t">${repeatText} · ${repeatText} · ${repeatText} ·</text>`;
      }).join("")}
    </g>
  </svg>`;
  return Buffer.from(svg);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await context.params;

  const supabase = serviceSupabase();
  const body = await req.json();
  const original_path: string | undefined = body?.original_path;

  if (!original_path) {
    return new NextResponse("original_path manquant", { status: 400 });
  }

  // 1) download original from private bucket
  const { data: file, error: dlErr } = await supabase.storage
    .from("originals")
    .download(original_path);

  if (dlErr || !file) {
    return new NextResponse(dlErr?.message ?? "download failed", { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const now = Date.now();

  // 2) thumbnail
  const thumbBuf = await sharp(inputBuffer)
    .resize({ width: 900, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  const thumbPath = `thumbnails/${id}/${now}-thumb.jpg`;
  {
    const { error } = await supabase.storage
      .from("public-images")
      .upload(thumbPath, new Blob([new Uint8Array(thumbBuf)], { type: "image/jpeg" }), {
        upsert: true,
        contentType: "image/jpeg",
      });

    if (error) return new NextResponse(error.message, { status: 400 });
  }

  // 3) flipagram (watermark répété)
  const wm = makeWatermarkSVG("photographi.nes");
  const flipBuf = await sharp(inputBuffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .composite([{ input: wm, tile: true, blend: "over" }])
    .jpeg({ quality: 80 })
    .toBuffer();

  const flipPath = `flip/${id}/${now}-flip.jpg`;
  {
    const { error } = await supabase.storage
      .from("previews")
      .upload(flipPath, new Blob([new Uint8Array(flipBuf)], { type: "image/jpeg" }), {
        upsert: true,
        contentType: "image/jpeg",
      });

    if (error) return new NextResponse(error.message, { status: 400 });
  }

  // 4) public urls
  const thumbnail_url = supabase.storage.from("public-images").getPublicUrl(thumbPath).data.publicUrl;
  const flipagram_url = supabase.storage.from("previews").getPublicUrl(flipPath).data.publicUrl;

  // 5) update product
  const { error: updErr } = await supabase
    .from("products")
    .update({ thumbnail_url, flipagram_url })
    .eq("id", id);

  if (updErr) return new NextResponse(updErr.message, { status: 400 });

  return NextResponse.json({ thumbnail_url, flipagram_url });
}
