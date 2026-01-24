"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CartItem,
  getCart,
  setQty,
  removeFromCart,
  clearCart,
} from "@/components/cart/cartStorage";

import { calculateTotalPrice } from "@/lib/pricing";

/* ---------- helpers ---------- */

function getPricingLabel(photoCount: number) {
  if (photoCount === 1) return "Tarif individuel";
  if (photoCount === 3) return "Pack 3 photos";
  if (photoCount === 4) return "Pack 3 + 1";
  if (photoCount === 5) return "Pack 5 photos";
  return "Tarif standard";
}

/* ---------- page ---------- */

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems(getCart());
  }, []);

  // nombre total de photos = somme des quantités
  const photoCount = useMemo(
    () => items.reduce((sum, i) => sum + (i.qty ?? 0), 0),
    [items]
  );

  // total sans promo (8€ * qty)
  const baseTotalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.price_cents * i.qty, 0),
    [items]
  );

  // total avec bundle
  const bundleTotalEuros = useMemo(
    () => calculateTotalPrice(photoCount),
    [photoCount]
  );

  const bundleTotalCents = bundleTotalEuros * 100;
  const savingsCents = Math.max(0, baseTotalCents - bundleTotalCents);

  /* ---------- Stripe ---------- */

  const handleCheckout = async () => {
    if (photoCount <= 0) return;

    try {
      setLoading(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            qty: i.qty,
          })),
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur lors du paiement");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
      setLoading(false);
    }
  };

  /* ---------- render ---------- */

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Panier
        </h1>
        <Link
          href="/shop"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Continuer mes achats
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-neutral-600">Ton panier est vide.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-black"
          >
            Aller à la boutique
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Items */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-2xl border border-neutral-100 p-3"
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-neutral-50">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {(item.price_cents / 100).toFixed(2)} € / unité
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setItems(setQty(item.id, item.qty - 1))}
                      className="h-9 w-9 rounded-xl border border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                    >
                      −
                    </button>

                    <span className="w-8 text-center text-sm text-neutral-900">
                      {item.qty}
                    </span>

                    <button
                      onClick={() => setItems(setQty(item.id, item.qty + 1))}
                      className="h-9 w-9 rounded-xl border border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                    >
                      +
                    </button>
                  </div>

                  <div className="w-24 text-right text-sm font-medium text-neutral-900">
                    {((item.price_cents * item.qty) / 100).toFixed(2)} €
                  </div>

                  <button
                    onClick={() => setItems(removeFromCart(item.id))}
                    className="text-xs text-neutral-500 hover:text-neutral-900"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-sm text-neutral-600">
                  {photoCount} photo{photoCount > 1 ? "s" : ""} •{" "}
                  <span className="text-neutral-500">
                    {getPricingLabel(photoCount)}
                  </span>
                </div>

                {savingsCents > 0 ? (
                  <div className="mt-2 text-sm text-neutral-600">
                    <span className="line-through text-neutral-400">
                      {(baseTotalCents / 100).toFixed(2)} €
                    </span>
                    <span className="ml-2 font-medium text-neutral-900">
                      Économie : {(savingsCents / 100).toFixed(2)} €
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-neutral-500">
                    Tarif standard appliqué.
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-sm text-neutral-600">Total</div>
                <div className="text-lg font-semibold text-neutral-900">
                  {(bundleTotalCents / 100).toFixed(2)} €
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
            >
              {loading ? "Redirection..." : "Payer"}
            </button>

            <button
              onClick={() => {
                clearCart();
                setItems([]);
              }}
              className="mt-3 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
            >
              Vider le panier
            </button>

            <div className="mt-4 text-xs text-neutral-500">
              Règles : 1=8€ • 3=20€ • 4=28€ • 5=30€ • 6=38 • 7=50€ • 8=56 • 9=58€ 10=60€/photo
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
