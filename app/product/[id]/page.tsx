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
  description?: string | null;
  created_at?: string;
  [key: string]: any;
};

// ✅ helper: support params being a Promise (Next 16)
async function unwrapParams(
  params: Promise<{ id: string }> | { id: string }
): Promise<{ id: string }> {
  return await Promise.resolve(params);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await unwrapParams(params);

  if (!id) return notFound();

  const { data: product, error } = await supabasePublic
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !product) return notFound();

  const p = product as Product;

  const imgSrc =
    p.image_url && p.image_url.trim().length > 0 ? p.image_url : "/placeholder.png";

  return (
    <Shell>
      <main className="pt-12 pb-24">
        {/* Top bar */}
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
          {/* Image */}
          <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white">
            <div className="p-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-black/3">
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

          {/* Infos */}
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-black/40">
              Produit
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {p.title ?? "Sans titre"}
            </h1>

            <div className="mt-4 text-lg font-semibold text-black/80">
              {(p.price_cents / 100).toFixed(2)} {p.currency ?? "EUR"}
            </div>

            {p.description ? (
              <p className="mt-5 max-w-xl text-sm leading-6 text-black/60">
                {p.description}
              </p>
            ) : null}

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

            {/* (Optionnel) Détails DB pour dev */}
            <div className="mt-10 overflow-hidden rounded-[28px] border border-black/10 bg-white">
              <div className="px-6 py-5">
                <div className="text-sm font-semibold text-black/80">
                  Détails (DB)
                </div>
                <div className="mt-1 text-xs text-black/45">
                  Temporaire pour vérifier les champs.
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
                      <span className="max-w-[60%] wrap-break-word text-right text-black/80">
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
          </div>
        </div>
      </main>
    </Shell>
  );
}
