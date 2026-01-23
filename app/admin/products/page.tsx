import Link from "next/link";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@supabase/supabase-js";
import { AdminCard } from "@/components/ui/AdminCard";
import { AdminButton } from "@/components/ui/AdminButton";

export const dynamic = "force-dynamic";

function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = serviceSupabase();

  const { data: products } = await supabase
    .from("products")
    // ✅ Une seule image par produit (watermarkée) => products.image_url
    .select("id,title,price_cents,is_active,image_url,created_at,sport,team,person,taken_at")
    .order("created_at", { ascending: false });

  return (
    <div className="py-12">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-black/40">
            Admin · Catalogue
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Produits
          </h1>
          <p className="mt-3 text-sm text-black/60">
            Gère tes photos, leurs infos, et leur visibilité en boutique.
          </p>
        </div>

        <Link href="/admin/products/new">
          <AdminButton>+ Nouveau produit</AdminButton>
        </Link>
      </div>

      <div className="mt-10">
        <AdminCard
          title="Liste"
          subtitle="Clique sur un produit pour l’éditer."
        >
          <div className="divide-y divide-black/5">
            {(products ?? []).map((p) => {
              const price = ((p.price_cents ?? 0) / 100).toFixed(2);
              return (
                <Link
                  key={p.id}
                  href={`/admin/products/${p.id}`}
                  className="group flex items-center gap-5 py-4"
                >
                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-black/10 bg-black/2">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold">
                        {p.title ?? "Sans titre"}
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                          p.is_active
                            ? "bg-black text-white"
                            : "bg-black/6 text-black/60"
                        }`}
                      >
                        {p.is_active ? "Actif" : "Brouillon"}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-black/45">
                      {p.sport ? <span>Sport: {p.sport}</span> : null}
                      {p.team ? <span>Équipe: {p.team}</span> : null}
                      {p.person ? <span>Personne: {p.person}</span> : null}
                      {p.taken_at ? <span>Prise le: {p.taken_at}</span> : null}
                    </div>
                  </div>

                  <div className="text-sm font-semibold tabular-nums text-black/70">
                    {price} €
                  </div>

                  <div className="text-black/30 transition group-hover:text-black/60">
                    →
                  </div>
                </Link>
              );
            })}
            {(products ?? []).length === 0 ? (
              <div className="py-10 text-sm text-black/50">
                Aucun produit pour l’instant. Crée ton premier.
              </div>
            ) : null}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
