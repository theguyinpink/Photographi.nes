"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

type Item = { id: string; qty?: number };

type Order = {
  id: string;
  status: string | null;
  total_cents: number | null;
  currency: string | null;
  email: string | null;
  items: Item[] | null;
  photo_count: number | null;
  created_at: string | null;
  sent_at?: string | null;
};

type ProductsMap = Record<string, { id: string; title: string; image_url: string | null }>;

function euros(cents: number | null, currency?: string | null) {
  const c = cents ?? 0;
  const cur = (currency ?? "EUR").toUpperCase();
  return `${(c / 100).toFixed(2)} ${cur}`;
}

export default function OrdersTable({
  initialOrders,
  productsMap,
}: {
  initialOrders: Order[];
  productsMap: ProductsMap;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [savingId, setSavingId] = useState<string | null>(null);
  const toast = useToast();

  const rows = useMemo(() => {
    return orders.map((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      const photoCount =
        o.photo_count ?? items.reduce((sum, it) => sum + (it?.qty ?? 1), 0);
      return { ...o, __items: items, __photoCount: photoCount };
    });
  }, [orders]);

  async function setStatus(orderId: string, nextStatus: string) {
    setSavingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Erreur");

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: json.order.status, sent_at: json.order.sent_at ?? null }
            : o
        )
      );

      toast.success(
        nextStatus === "SENT" ? "Commande marquée comme envoyée" : "Statut mis à jour",
        "Commandes"
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Impossible de mettre à jour", "Erreur");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white">
      <div className="p-4 sm:p-6">
        <div className="text-sm font-semibold text-black/80">Liste des commandes</div>
        <div className="mt-1 text-xs text-black/45">
          Détail des photos achetées (miniatures) + suivi d’envoi.
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-t border-black/10 bg-black/2 text-xs uppercase tracking-[0.18em] text-black/45">
            <tr>
              <th className="px-6 py-4">Commande</th>
              <th className="px-6 py-4">Photos</th>
              <th className="px-6 py-4">Prix</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">Envoyée</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-black/10">
            {rows.map((o) => {
              const status = String(o.status ?? "").toUpperCase();
              const isSent = status === "SENT";
              const isPaid = status === "PAID";
              const locked = savingId === o.id;

              const items = (o as any).__items as Item[];

              return (
                <tr key={o.id} className="hover:bg-black/1.5 align-top">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-black/70">{o.id}</div>
                    <div className="mt-1 text-xs text-black/40">
                      {o.created_at ? new Date(o.created_at).toLocaleString() : ""}
                    </div>
                  </td>

                  {/* ✅ Photos details */}
                  <td className="px-6 py-4">
                    <div className="text-xs text-black/55 mb-2">
                      {(o as any).__photoCount} photo(s)
                    </div>

                    <div className="flex flex-col gap-2">
                      {items.length === 0 ? (
                        <div className="text-xs text-black/40">—</div>
                      ) : (
                        items.map((it, idx) => {
                          const p = productsMap[it.id];
                          const qty = it.qty ?? 1;

                          return (
                            <div key={`${it.id}-${idx}`} className="flex items-center gap-3">
                              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-black/10 bg-black/2">
                                {p?.image_url ? (
                                  <Image
                                    src={p.image_url}
                                    alt={p.title}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                ) : null}
                              </div>

                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-black/75">
                                  {p?.title ?? "Photo supprimée / introuvable"}
                                </div>
                                <div className="font-mono text-[11px] text-black/35 truncate">
                                  {it.id}
                                </div>
                              </div>

                              {qty > 1 ? (
                                <span className="ml-auto text-xs text-black/50">× {qty}</span>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 font-medium text-black/80">
                    {euros(o.total_cents, o.currency)}
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-black/75">{o.email ?? "—"}</div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/70">
                      {status || "—"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <label className="inline-flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-black/20"
                        checked={isSent}
                        disabled={locked || !(isPaid || isSent)}
                        onChange={(e) =>
                          setStatus(o.id, e.target.checked ? "SENT" : "PAID")
                        }
                      />
                      <span className="text-xs text-black/55">
                        {isSent
                          ? o.sent_at
                            ? `Oui · ${new Date(o.sent_at).toLocaleString()}`
                            : "Oui"
                          : "Non"}
                      </span>
                    </label>

                    {!isPaid && !isSent ? (
                      <div className="mt-2 text-xs text-black/35">
                        (Disponible après paiement)
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-sm text-black/60">Aucune commande.</div>
      ) : null}
    </div>
  );
}
