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
  [key: string]: any;
};

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

  const { data, error } = await supabasePublic
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return notFound();

  const p = data as Product;

  const imgSrc =
    p.image_url && p.image_url.trim().length > 0 ? p.image_url : "/placeholder.png";

  return (
    <Shell>
      <main className="pt-12 pb-24">
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
          <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white">
            <div className="p-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-black/3">
                <Image
                  src={imgSrc}
                  alt={p.title ?? "Photo"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 900px) 100vw, 50vw"
                  priority
                  quality={65}
                  // ✅ si tu n'as pas encore configuré next.config images, active ça temporairement
                  // unoptimized
                />
              </div>

              <p className="mt-3 text-xs text-black/45">
                Preview watermarkée
              </p>
            </div>
          </div>

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
          </div>
        </div>
      </main>
    </Shell>
  );
}
