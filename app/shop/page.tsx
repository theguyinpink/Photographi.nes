// app/shop/page.tsx
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { supabasePublic } from "@/lib/supabase-public";

type Product = {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  thumbnail_url: string | null;
  created_at?: string;
};

export default async function ShopPage() {
  const { data, error } = await supabasePublic
    .from("products")
    .select("id,title,price_cents,currency,thumbnail_url,created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const products = (data ?? []) as Product[];

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

          <Link
            href="/cart"
            className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black/80 hover:bg-black/3 transition"
          >
            Ouvrir le panier
          </Link>
        </div>

        {/* Gallery grid */}
        {error ? (
          <div className="mt-10 rounded-3xl border border-black/10 bg-white p-8 text-sm text-black/60">
            Erreur Supabase : {error.message}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-black/10 bg-white p-10">
            <div className="text-sm text-black/60">
              Aucun produit pour l’instant.
            </div>
            <div className="mt-6">
              <Link
                href="/admin/products"
                className="underline underline-offset-8 text-sm font-medium"
              >
                Aller à l’admin
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="group">
                <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white">
                  <div className="p-3">
                    <div className="relative w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.thumbnail_url ?? ""}
                        alt={p.title}
                        className="w-full h-auto object-contain"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Infos très discrètes (Leen Heyne vibe) */}
                  <div className="px-5 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold tracking-tight">
                          {p.title}
                        </div>
                        <div className="mt-2 text-sm text-black/55">
                          {(p.price_cents / 100).toFixed(2)} {p.currency}
                        </div>
                      </div>

                      <span className="text-xs text-black/40 group-hover:text-black/70 transition">
                        Ouvrir
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
