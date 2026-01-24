// app/shop/page.tsx
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { supabasePublic } from "@/lib/supabase-public";
import Filters from "./Filters";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Product = {
  id: string;
  title: string;
  price_cents: number;
  currency: string | null;
  image_url: string | null;
  created_at?: string;

  sport: string | null;
  team: string | null;
  category: string | null;
  person: string | null;
};

function uniqSorted(values: (string | null | undefined)[]) {
  return Array.from(
    new Set(
      values
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter((v) => v.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, "fr"));
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    sport?: string;
    team?: string;
    category?: string;
    person?: string;
  }>;
}) {
  const sp = await searchParams;

  // ✅ base query
  let q = supabasePublic
    .from("products")
    .select(
      "id,title,price_cents,currency,image_url,created_at,sport,team,category,person"
    )
    .eq("is_active", true);

  // ✅ apply filters if present (exact match)
  if (sp.sport) q = q.eq("sport", sp.sport);
  if (sp.team) q = q.eq("team", sp.team);
  if (sp.category) q = q.eq("category", sp.category);
  if (sp.person) q = q.eq("person", sp.person);

  const { data, error } = await q.order("created_at", { ascending: false });

  const products = (data ?? []) as Product[];

  // ✅ options for dropdowns: derive from ALL active products (not only filtered)
  // (so you don't "lose" options once a filter is applied)
  const { data: allData } = await supabasePublic
    .from("products")
    .select("sport,team,category,person")
    .eq("is_active", true);

  const options = {
    sports: uniqSorted(allData?.map((x) => x.sport) ?? []),
    teams: uniqSorted(allData?.map((x) => x.team) ?? []),
    categories: uniqSorted(allData?.map((x) => x.category) ?? []),
    persons: uniqSorted(allData?.map((x) => x.person) ?? []),
  };

  return (
    <Shell>
      <div className="pt-12 pb-24">
        {/* Top row */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-black/40">
              Galerie
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Boutique
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-black/60">
              Clique sur une photo pour ouvrir la fiche (preview protégé) et
              l’ajouter au panier.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Filters options={options} />

            <Link
              href="/cart"
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black/80 transition hover:bg-black/3"
            >
              Panier
            </Link>
          </div>
        </div>

        {/* Gallery grid */}
        {error ? (
          <div className="mt-10 rounded-3xl border border-black/10 bg-white p-8 text-sm text-black/60">
            Erreur Supabase : {error.message}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-black/10 bg-white p-10">
            <div className="text-sm text-black/60">
              Aucun produit pour ces filtres.
            </div>
            <div className="mt-6">
              <Link
                href="/shop"
                className="underline underline-offset-8 text-sm font-medium"
              >
                Réinitialiser les filtres
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const src =
                p.image_url && p.image_url.trim().length > 0
                  ? p.image_url
                  : "/placeholder.png";

              return (
                <Link key={p.id} href={`/product/${p.id}`} className="group">
                  <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white">
                    <div className="p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={p.title}
                        className="h-auto w-full object-contain"
                        loading="lazy"
                      />
                    </div>

                    <div className="px-5 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold tracking-tight">
                            {p.title}
                          </div>

                          <div className="mt-2 text-sm text-black/55">
                            {(p.price_cents / 100).toFixed(2)}{" "}
                            {p.currency ?? "EUR"}
                          </div>

                          {/* ✅ tags discrets (optionnel mais utile) */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {p.sport ? (
                              <span className="rounded-full border border-black/10 bg-black/2 px-3 py-1 text-[11px] text-black/60">
                                {p.sport}
                              </span>
                            ) : null}
                            {p.team ? (
                              <span className="rounded-full border border-black/10 bg-black/2 px-3 py-1 text-[11px] text-black/60">
                                {p.team}
                              </span>
                            ) : null}
                            {p.category ? (
                              <span className="rounded-full border border-black/10 bg-black/2 px-3 py-1 text-[11px] text-black/60">
                                {p.category}
                              </span>
                            ) : null}
                            {p.person ? (
                              <span className="rounded-full border border-black/10 bg-black/2 px-3 py-1 text-[11px] text-black/60">
                                {p.person}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <span className="text-xs text-black/40 transition group-hover:text-black/70">
                          Ouvrir
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
