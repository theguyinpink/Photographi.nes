"use client";

import { useState } from "react";
import { addItem } from "./cartStorage";

type Props = {
  product: {
    id: string;
    title: string;
    image_url: string;
    price_cents: number;
  };
};

export default function AddToCartButton({ product }: Props) {
  const [loading, setLoading] = useState(false);

  function onAdd() {
    setLoading(true);
    try {
      addItem(
        {
          id: product.id,
          title: product.title,
          image_url: product.image_url,
          price_cents: product.price_cents,
          currency: "EUR",
        },
        1
      );
      alert("Ajouté au panier ✅");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onAdd}
      disabled={loading}
      className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
    >
      {loading ? "Ajout…" : "Ajouter au panier"}
    </button>
  );
}
