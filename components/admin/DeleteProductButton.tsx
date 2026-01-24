"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

export default function DeleteProductButton({
  id,
  title,
}: {
  id: string;
  title?: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function onDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    const ok = window.confirm(
      `Supprimer définitivement ce produit ?\n\n${title ?? id}\n\n⚠️ Cette action est irréversible.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const r = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(await r.text());

      toast.success("Produit supprimé ✅");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Suppression impossible", "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      className="rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? "Suppression…" : "Supprimer"}
    </button>
  );
}
