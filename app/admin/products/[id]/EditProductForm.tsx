"use client";

import { useState } from "react";

type Product = {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  category: string | null;
  is_active: boolean;
  thumbnail_url: string | null;
  flipagram_url: string | null;
};

export default function EditProductForm({ product }: { product: Product }) {
  const [title, setTitle] = useState(product.title);
  const [price, setPrice] = useState((product.price_cents / 100).toFixed(2));
  const [category, setCategory] = useState(product.category ?? "");
  const [isActive, setIsActive] = useState(product.is_active);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        price_cents: Math.round(Number(price) * 100),
        category: category || null,
        is_active: isActive,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      alert(await res.text());
      return;
    }
    alert("Sauvegardé ✅");
  }

  async function uploadOriginalAndGenerate() {
    if (!file) return alert("Choisis une photo HD");
    setUploading(true);

    const fd = new FormData();
    fd.append("original", file);

    const res = await fetch(`/api/admin/products/${product.id}/images`, {
      method: "POST",
      body: fd,
    });

    setUploading(false);

    if (!res.ok) {
      alert(await res.text());
      return;
    }
    alert("Images générées + liées ✅ (refresh la page)");
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Infos */}
      <div className="rounded-3xl border border-black/10 bg-white p-8">
        <div className="text-sm font-semibold">Détails</div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-black/60 mb-1">Titre</label>
            <input
              className="w-full rounded-xl border border-black/10 px-4 py-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-black/60 mb-1">Prix (€)</label>
              <input
                className="w-full rounded-xl border border-black/10 px-4 py-3"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-black/60 mb-1">Catégorie</label>
              <input
                className="w-full rounded-xl border border-black/10 px-4 py-3"
                placeholder="sport / équipe / personne"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-black/70">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Produit actif (visible boutique)
          </label>

          <button
            onClick={save}
            disabled={loading}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Images */}
      <div className="rounded-3xl border border-black/10 bg-white p-8">
        <div className="text-sm font-semibold">Images</div>
        <p className="mt-2 text-sm text-black/60">
          Upload une photo HD. On génère automatiquement le thumbnail + flipagram.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <button
            onClick={uploadOriginalAndGenerate}
            disabled={uploading}
            className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black/80 hover:bg-black/3 disabled:opacity-50"
          >
            {uploading ? "Génération..." : "Uploader & générer"}
          </button>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-black/40">Thumbnail</div>
              <div className="mt-2 aspect-4/3 overflow-hidden rounded-2xl bg-black/3">
                {product.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.thumbnail_url} className="h-full w-full object-cover" alt="" />
                ) : null}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-black/40">Flipagram</div>
              <div className="mt-2 aspect-4/3 overflow-hidden rounded-2xl bg-black/3">
                {product.flipagram_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.flipagram_url} className="h-full w-full object-cover" alt="" />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
