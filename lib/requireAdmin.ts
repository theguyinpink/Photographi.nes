import { redirect } from "next/navigation";
import { supabaseServer } from "@/app/lib/supabase-server";

export async function requireAdmin() {
  const supabase = supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) redirect("/"); // ou /login
  return user;
}
