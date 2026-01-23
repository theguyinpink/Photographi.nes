// app/product/[id]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { supabasePublic } from "@/lib/supabase-public";
import AddToCartButton from "@/components/cart/AddToCartButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Product = {
  id: string;
  title: string;
  price_cents: number;
  currency: string | null;
  image_url: string | null;
  created_at?: string;

  // autres champs possibles (tu peux en ajouter ici si tu veux typage strict)
  [key: string]: any;
};

function getParamId(params: Record<string, string | string[] | undefined>) {
  // ✅ robuste : marche même si le dossier s’appelle [id] / [productId] / [uuid]
  const raw =
    params?.id ??
    params?.productId ??
    params?.uuid ??
    params?.slug ??
    undefined;

  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

export default async function ProductPage({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  // ✅ récupère l’id quel que soit le nom réel du segment
  const id = getParamId(params);

  // si pas d’id → 404 propre
  if (!id) return notFound();

  // ✅ récupère le produit
  const { data: product, error } = await supabasePublic
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // si erreur ou pas trouvé → 404
  if (error || !product) return notFound();

  const p = product as Product;

  const imgSrc =
    p.image_url && p.image_url.trim().length > 0 ? p.image_url : "/placeholder.png";

  const price =
    typeof p.price_cents === "number"
      ? (p.price_cents / 100).toFixed(2)
      : "—";

  const currency = p.currency ?? "EUR";

  return (
    <Shell>
      <main className="pt-12 pb-24">
        {/* top bar */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/shop"
            className="text-sm text-black/55 hover:text-black/80 transition"
          >
            ← Retour à la boutique
          </Link>

          <Link
            href="/cart"
            className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black/80 transition hover:bg-black/3"
          >
            Panier
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* IMAGE */}
          <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white">
            <div className="p-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-black/[0.03]">
                {/* Si tu préfères <img> comme sur shop, tu peux remplacer */}
                <Image
                  src={imgSrc}
                  alt={p.title ?? "Photo"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>

              <p className="mt-3 text-xs text-black/45">
                Preview watermarkée (bucket previews)
              </p>
            </div>
          </div>

          {/* INFOS */}
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-black/40">
              Produit
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {p.title ?? "Sans titre"}
            </h1>

            <div className="mt-4 text-lg font-semibold text-black/80">
              {price} {currency}
            </div>

            {/* Description si dispo */}
            {typeof p.description === "string" && p.description.trim().length > 0 ? (
              <p className="mt-5 max-w-xl text-sm leading-6 text-black/60">
                {p.description}
              </p>
            ) : null}

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              <AddToCartButton
                product={{
                  id: p.id,
                  title: p.title ?? "Sans titre",
                  image_url: p.image_url ?? "",
                  price_cents: typeof p.price_cents === "number" ? p.price_cents : 0,
                }}
              />

              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black/80 transition hover:bg-black/3"
              >
                Continuer
              </Link>
            </div>

            {/* Détails DB (temporaire, utile pour vérifier que tout remonte) */}
            <div className="mt-10 overflow-hidden rounded-[28px] border border-black/10 bg-white">
              <div className="px-6 py-5">
                <div className="text-sm font-semibold text-black/80">
                  Détails (DB)
                </div>
                <div className="mt-1 text-xs text-black/45">
                  (Tu pourras remplacer par un layout plus joli une fois les champs finalisés)
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="grid gap-2 text-sm">
                  {Object.entries(p).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-4 border-b border-black/5 pb-2 last:border-b-0 last:pb-0"
                    >
                      <span className="text-black/45">{key}</span>
                      <span className="max-w-[60%] break-words text-right text-black/80">
                        {value === null || value === undefined
                          ? "—"
                          : typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Note UX */}
            <p className="mt-4 text-xs text-black/45">
              Si tu veux, on remplace le bloc “Détails (DB)” par un affichage ultra clean
              (sport, équipe, date, lieu, photographe, etc.).
            </p>
          </div>
        </div>
      </main>
    </Shell>
  );
}
