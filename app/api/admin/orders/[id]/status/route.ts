import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const ALLOWED = new Set(["PENDING", "PAID", "SENT", "CANCELED"]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const status = String(body?.status ?? "").toUpperCase();

    if (!ALLOWED.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const patch: Record<string, any> = { status };
    // ✅ historiser l’envoi
    if (status === "SENT") patch.sent_at = new Date().toISOString();
    if (status !== "SENT") patch.sent_at = null;

    const { data, error } = await supabase
      .from("orders")
      .update(patch)
      .eq("id", id)
      .select("id,status,sent_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, order: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
