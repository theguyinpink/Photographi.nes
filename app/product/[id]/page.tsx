// app/shop/[id]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import AddToCartButton from "@/components/cart/AddToCartButton";
export const dynamic = "force-dynamic";
export const revalidate = 0;



type Props = {
  params: { id: string };
};


export default async function ProductPage({ params }: Props) {
const supabase = supabaseServer();


const { data: product, error } = await (await supabase)
  .from("products")
  .select("*")
  .eq("id", params.id)
  .single();

if (error || !product) {
  return (
    <div style={{ padding: 40 }}>
      <h1>Produit introuvable (debug)</h1>
      <p><b>params.id</b> : {params.id}</p>
      <pre>{JSON.stringify({ error, product }, null, 2)}</pre>
    </div>
  );
}


  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <Link
          href="/shop"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Retour à la boutique
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-3 shadow-sm">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-50">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.title ?? "Photo"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                Pas d’image
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Aperçu watermarké (previews)
          </p>
        </div>

        {/* Infos */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {product.title ?? "Sans titre"}
          </h1>

          <div className="mt-2 text-lg font-medium text-neutral-900">
            {typeof product.price === "number"
              ? (product.price / 100).toFixed(2) + " €"
              : product.price ?? "—"}
          </div>

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed text-neutral-700">
              {product.description}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <AddToCartButton
              product={{
                id: product.id,
                title: product.title ?? "Sans titre",
                image_url: product.image_url ?? "",
                price_cents: typeof product.price === "number" ? product.price : 0,
              }}
              />
            <Link
              href="/cart"
              className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
            >
              Voir le panier
            </Link>
          </div>

          {/* “Toutes les infos DB” */}
          <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-900">
              Détails (Supabase)
            </h2>

            <div className="mt-4 grid gap-2 text-sm">
              {Object.entries(product).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-2 last:border-b-0 last:pb-0"
                >
                  <span className="text-neutral-500">{key}</span>
                  <span className="max-w-[60%] wrap-break-word text-right text-neutral-900">
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

          <p className="mt-3 text-xs text-neutral-500">
            Astuce : si tu veux un affichage plus joli, on remplacera la liste
            brute par des champs “propres” (sport, équipe, date, etc.).
          </p>
        </div>
      </div>
    </main>
  );
}
