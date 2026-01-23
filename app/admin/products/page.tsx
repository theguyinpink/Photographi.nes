// app/admin/products/page.tsx
import { Shell } from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

type ProductRow = {
  id: string;
  title: string;
  price_cents: number;
  is_active: boolean;
  created_at: string;
};

export default async function AdminProductsPage() {
  const { data: products, error } = await supabaseServer
    .from("products")
    .select("id,title,price_cents,is_active,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <Shell>
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-lg font-semibold">Erreur</div>
          <p className="mt-2 text-sm text-neutral-600">
            Impossible de charger les produits : {error.message}
          </p>
        </div>
      </Shell>
    );
  }

  const list = (products ?? []) as ProductRow[];

  return (
    <Shell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin · Produits</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Ajoute, modifie et active/désactive les produits de la boutique.
          </p>
        </div>

        <a
          href="/admin/products/new"
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-95"
        >
          Ajouter un produit
        </a>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-4">
        {list.length === 0 ? (
          <div className="text-neutral-600">Aucun produit pour l’instant.</div>
        ) : (
          <div className="space-y-3">
            {list.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between gap-3 rounded-xl border p-3 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="mt-1 text-sm text-neutral-600">
                    {(p.price_cents / 100).toFixed(2)} € ·{" "}
                    <span className={p.is_active ? "text-emerald-600" : "text-rose-600"}>
                      {p.is_active ? "Actif" : "Inactif"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Créé le {new Date(p.created_at).toLocaleString("fr-FR")}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/admin/products/${p.id}`}
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    Éditer
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
