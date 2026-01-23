// app/admin/products/[id]/page.tsx
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import EditProductForm from "./EditProductForm";

export const dynamic = "force-dynamic";

function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type Product = {
  id: string;
  title: string;
  price_cents: number;
  currency: string | null;
  image_url: string | null;
  description: string | null;
  sport: string | null;
  team: string | null;
  person: string | null;
  taken_at: string | null;
  is_active: boolean;
  created_at?: string | null;
};

export default async function AdminEditProductPage({
  params,
}: {
  // ✅ Next 16 peut fournir params en Promise
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  if (!id) notFound();

  const supabase = serviceSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,title,price_cents,currency,image_url,description,sport,team,person,taken_at,is_active,created_at"
    )
    .eq("id", id)
    .single();

  const product = (data ?? null) as Product | null;

  if (error || !product) {
    return (
      <div className="py-16 text-sm text-black/60">
        Produit introuvable (ou non accessible).
        <div className="mt-2 text-xs text-black/40">{error?.message ?? ""}</div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="text-xs uppercase tracking-[0.22em] text-black/40">
        Admin · Produit
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Éditer : {product.title}
      </h1>

      <div className="mt-10">
        {/* ⚠️ Ceci nécessite que EditProductForm accepte la prop product */}
        <EditProductForm product={product} />
      </div>
    </div>
  );
}
