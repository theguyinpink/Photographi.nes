import { requireAdmin } from "@/lib/requireAdmin";
import { supabaseServer } from "@/lib/supabase-server";
import EditProductForm from "./EditProductForm";

export default async function AdminEditProductPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !product) {
    return <div className="py-16 text-sm text-black/60">Produit introuvable.</div>;
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
        <EditProductForm product={product} />
      </div>
    </div>
  );
}
