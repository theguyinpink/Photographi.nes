import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function loadLogoAsPngWithAlpha(alpha: number) {
  // alpha: 0..1 (0 = invisible, 1 = opaque)
  const logoPath = path.join(process.cwd(), "public", "logo-ines.png");
  const logoFile = fs.readFileSync(logoPath);

  // On convertit le logo en PNG RGBA et on “baisse” son alpha.
  // (évite d'utiliser `opacity` dans composite, qui n'existe pas dans certains typings)
  const alphaInt = Math.max(0, Math.min(255, Math.round(alpha * 255)));

  // On applique un alpha constant via un canal alpha uniforme
  const meta = await sharp(logoFile).ensureAlpha().metadata();
  const w = meta.width ?? 256;
  const h = meta.height ?? 256;

  const alphaMask = Buffer.alloc(w * h, alphaInt); // 1 byte/pixel
  const out = await sharp(logoFile)
    .ensureAlpha()
    .joinChannel(alphaMask, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer();

  return out;
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

  // 1) Download original depuis bucket privé
  const { data: file, error: dlErr } = await supabase.storage
    .from("originals")
    .download(original_path);

  if (dlErr || !file) {
    return new NextResponse(dlErr?.message ?? "download failed", { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const now = Date.now();

  // 2) Prépare 2 versions du logo (léger / fort)
  const logoLight = await loadLogoAsPngWithAlpha(0.28); // thumbnail
  const logoStrong = await loadLogoAsPngWithAlpha(0.14); // flip tile (répété)

  // 3) THUMBNAIL (watermark léger)
  const thumbBuf = await sharp(inputBuffer)
    .resize({ width: 900, withoutEnlargement: true })
    .composite([
      {
        input: logoLight,
        gravity: "southeast", // coin bas droit
      },
    ])
    .jpeg({ quality: 82 })
    .toBuffer();

  const thumbPath = `thumbnails/${id}/${now}-thumb.jpg`;
  {
    const { error } = await supabase.storage.from("public-images").upload(
      thumbPath,
      new Blob([new Uint8Array(thumbBuf)], { type: "image/jpeg" }),
      { upsert: true, contentType: "image/jpeg" }
    );
    if (error) return new NextResponse(error.message, { status: 400 });
  }

  // 4) FLIPAGRAM (watermark fort : logo répété partout)
  const flipBuf = await sharp(inputBuffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .composite([
      {
        input: logoStrong,
        tile: true, // répète le logo sur toute l’image
        gravity: "center",
      },
    ])
    .jpeg({ quality: 82 })
    .toBuffer();

  const flipPath = `flip/${id}/${now}-flip.jpg`;
  {
    const { error } = await supabase.storage.from("previews").upload(
      flipPath,
      new Blob([new Uint8Array(flipBuf)], { type: "image/jpeg" }),
      { upsert: true, contentType: "image/jpeg" }
    );
    if (error) return new NextResponse(error.message, { status: 400 });
  }

  // 5) URLs publiques
  const thumbnail_url = supabase.storage
    .from("public-images")
    .getPublicUrl(thumbPath).data.publicUrl;

  const flipagram_url = supabase.storage
    .from("previews")
    .getPublicUrl(flipPath).data.publicUrl;

  // 6) Update DB
  const { error: updErr } = await supabase
    .from("products")
    .update({ thumbnail_url, flipagram_url })
    .eq("id", id);

  if (updErr) return new NextResponse(updErr.message, { status: 400 });

  return NextResponse.json({ thumbnail_url, flipagram_url });
}
