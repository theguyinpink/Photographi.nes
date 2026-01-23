import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json(data);
}
