import Link from "next/link";
import { requireAdmin } from "@/lib/requireAdmin";
import { supabaseServer } from "@/lib/supabase-server";

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = await supabaseServer(); // ✅ await ici

  const { data: products, error } = await supabase
    .from("products")
    .select("id,title,price_cents,is_active,created_at,thumbnail_url")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="py-16 text-sm text-black/60">
        Erreur: {error.message}
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-black/40">
            Admin
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Produits
          </h1>
        </div>

        <Link
          href="/admin/products/new"
          className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
        >
          Nouveau produit
        </Link>
      </div>

      <div className="mt-10 divide-y divide-black/10 rounded-3xl border border-black/10 bg-white">
        {(products ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/admin/products/${p.id}`}
            className="flex items-center justify-between gap-6 px-6 py-5 hover:bg-black/3"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{p.title}</div>
              <div className="mt-1 text-xs text-black/50">
                {(p.price_cents / 100).toFixed(2)} € ·{" "}
                {p.is_active ? "Actif" : "Inactif"}
              </div>
            </div>

            <div className="text-xs text-black/40">Éditer →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
