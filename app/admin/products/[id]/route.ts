import { NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabase-server";
import { requireAdmin } from "@/app/lib/requireAdmin";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const supabase = supabaseServer();
  const body = await req.json();

  const { error } = await supabase
    .from("products")
    .update(body)
    .eq("id", params.id);

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}
