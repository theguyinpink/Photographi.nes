"use client";

import { useState } from "react";
import { supabasePublic } from "@/lib/supabase-public";
import UploadImages from "../UploadImages";

export default function NewProductPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createProduct() {
    if (!title || !price) {
      alert("Titre et prix requis");
      return;
    }

    setLoading(true);

    const { data, error } = await supabasePublic
      .from("products")
      .insert({
        title,
        price_cents: Math.round(Number(price) * 100),
        currency: "EUR",
        is_active: true,
      })
      .select("id")
      .single();

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setProductId(data.id);
  }

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold">Nouveau produit</h1>

      {!productId && (
        <div className="space-y-4">
          <input
            className="w-full rounded-xl border px-4 py-2"
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            className="w-full rounded-xl border px-4 py-2"
            placeholder="Prix (€)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <button
            onClick={createProduct}
            disabled={loading}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white"
          >
            {loading ? "Création..." : "Créer le produit"}
          </button>
        </div>
      )}

      {productId && (
        <>
          <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            Produit créé. Ajoute maintenant les images 👇
          </div>

          <UploadImages productId={productId} />
        </>
      )}
    </div>
  );
}
