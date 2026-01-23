import { supabaseServer } from "./supabase-server";

export async function isAdmin(email: string | null) {
  if (!email) return false;

  const allowed = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()) ?? [];
  if (allowed.includes(email)) return true;

  const { data } = await supabaseServer
    .from("admin_allowlist")
    .select("email")
    .eq("email", email)
    .single();

  return !!data;
}
