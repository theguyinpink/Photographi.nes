import Link from "next/link";
import { requireAdmin } from "@/lib/requireAdmin";
import { supabaseServer } from "@/lib/supabase-server";

function money(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-black/3 px-3 py-1 text-xs text-black/70">
      {children}
    </span>
  );
}

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id,title,price_cents,is_active,created_at,thumbnail_url,sport,team,person,taken_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="py-16 text-sm text-black/60">Erreur: {error.message}</div>;
  }

  return (
    <div className="py-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-black/40">Admin</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Produits</h1>
          <p className="mt-3 text-sm text-black/60">
            Gère les photos, prix, catégories et aperçus (flipagram).
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
        >
          Nouveau produit
        </Link>
      </div>

      <div className="mt-10 overflow-hidden rounded-[28px] border border-black/10 bg-white">
        <div className="grid grid-cols-12 gap-3 border-b border-black/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-black/40">
          <div className="col-span-6">Produit</div>
          <div className="col-span-2 hidden md:block">Catégories</div>
          <div className="col-span-2 hidden md:block">Date</div>
          <div className="col-span-2 text-right">Prix / Statut</div>
        </div>

        <div className="divide-y divide-black/10">
          {(products ?? []).map((p) => (
            <Link
              key={p.id}
              href={`/admin/products/${p.id}`}
              className="grid grid-cols-12 gap-3 px-6 py-5 hover:bg-black/3"
            >
              <div className="col-span-8 md:col-span-6 flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 overflow-hidden rounded-2xl border border-black/10 bg-black/2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumbnail_url ?? ""}
                    alt={p.title}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{p.title}</div>
                  <div className="mt-1 text-xs text-black/50">
                    ID: <span className="font-mono">{String(p.id).slice(0, 8)}…</span>
                  </div>
                </div>
              </div>

              <div className="col-span-4 md:col-span-2 hidden md:flex flex-wrap gap-2">
                {p.sport ? <Chip>Sport: {p.sport}</Chip> : null}
                {p.team ? <Chip>Équipe: {p.team}</Chip> : null}
                {p.person ? <Chip>Personne: {p.person}</Chip> : null}
              </div>

              <div className="col-span-2 hidden md:block text-sm text-black/70">
                {p.taken_at ? new Date(p.taken_at).toLocaleDateString("fr-FR") : "—"}
              </div>

              <div className="col-span-4 md:col-span-2 text-right">
                <div className="text-sm font-semibold">{money(p.price_cents)}</div>
                <div className="mt-1 text-xs">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 ${
                      p.is_active
                        ? "bg-black text-white"
                        : "border border-black/10 bg-black/3 text-black/60"
                    }`}
                  >
                    {p.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
