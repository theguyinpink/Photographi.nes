"use client";

import { useState } from "react";

export default function NewProductPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  async function save() {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        price_cents: Math.round(Number(price) * 100),
      }),
    });

    if (res.ok) location.href = "/admin/products";
    else alert("Erreur");
  }

  return (
    <div className="max-w-xl space-y-4 rounded-2xl border bg-white p-6">
      <h1 className="text-xl font-semibold">Nouveau produit</h1>

      <input
        className="w-full rounded-xl border px-3 py-2"
        placeholder="Titre"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <input
        className="w-full rounded-xl border px-3 py-2"
        placeholder="Prix (€)"
        type="number"
        value={price}
        onChange={e => setPrice(e.target.value)}
      />

      <button onClick={save} className="rounded-xl bg-neutral-900 px-4 py-2 text-white">
        Enregistrer
      </button>
    </div>
  );
}
