import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  // ✅ IMPORTANT : en API route, on ne doit jamais laisser un redirect casser le handler
  try {
    await requireAdmin();
  } catch (e: any) {
    const msg = String(e?.digest ?? e?.message ?? e ?? "");
    if (msg.includes("NEXT_REDIRECT")) {
      return NextResponse.json(
        { error: "Unauthorized (admin required)" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: msg || "Unauthorized (admin required)" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const status = String((body as any)?.status ?? "")
      .trim()
      .toUpperCase();

    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    if (!ALLOWED.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const patch: Record<string, any> = { status };

    if (status === "SENT") {
      patch.sent_at = new Date().toISOString();
    } else {
      patch.sent_at = null;
    }

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
