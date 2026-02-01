import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient(
    must("NEXT_PUBLIC_SUPABASE_URL"),
    must("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );
}

const DELIVERY_BUCKET = process.env.DELIVERY_BUCKET ?? "deliveries";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ✅ admin only (anti NEXT_REDIRECT)
  try {
    await requireAdmin();
  } catch (e: any) {
    const msg = String(e?.digest ?? e?.message ?? e ?? "");
    if (msg.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: msg || "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const fileName = String(body?.fileName ?? "").trim();
  const contentType = String(body?.contentType ?? "").trim();

  if (!fileName) {
    return NextResponse.json({ error: "fileName manquant" }, { status: 400 });
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const path = `orders/${id}/${Date.now()}-${safeName}`;

  const supabase = supabaseAdmin();

  const { data, error } = await supabase.storage
    .from(DELIVERY_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Signed upload url failed", details: error?.message ?? String(error) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path,
    contentType: contentType || "application/octet-stream",
  });
}
