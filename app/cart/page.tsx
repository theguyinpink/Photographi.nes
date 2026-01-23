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

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(getCart());
  }, []);

  const totalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.price_cents * i.qty, 0),
    [items]
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Panier
        </h1>
        <Link href="/shop" className="text-sm text-neutral-500 hover:text-neutral-900">
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
                      />
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                    <p className="text-xs text-neutral-500">
                      {(item.price_cents / 100).toFixed(2)} € / unité
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setItems(setQty(item.id, item.qty - 1))}
                      className="h-9 w-9 rounded-xl border border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                      aria-label="Diminuer"
                    >
                      −
                    </button>

                    <span className="w-8 text-center text-sm text-neutral-900">
                      {item.qty}
                    </span>

                    <button
                      onClick={() => setItems(setQty(item.id, item.qty + 1))}
                      className="h-9 w-9 rounded-xl border border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                      aria-label="Augmenter"
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

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Total</span>
              <span className="text-lg font-semibold text-neutral-900">
                {(totalCents / 100).toFixed(2)} €
              </span>
            </div>

            <button
              onClick={() => alert("Prochaine étape : Stripe Checkout ✅")}
              className="mt-4 w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-black"
            >
              Payer
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
          </div>
        </div>
      )}
    </main>
  );
}
