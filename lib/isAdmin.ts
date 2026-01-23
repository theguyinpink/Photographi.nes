import { supabaseServer } from "@/lib/supabase-server";

export async function isAdmin(email: string) {
  const supabase = await supabaseServer(); // ✅ appeler + await

  const { data, error } = await supabase
    .from("admin_allowlist")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (error) return false;
  return !!data;
}
