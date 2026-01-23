"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  title: string;
  price: string;
  description: string;
  sport: string;
  team: string;
  person: string;
  taken_at: string;
  is_active: boolean;
};
export default function EditProductForm({ product }: { product: any }) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    title: "",
    price: "8",
    description: "",
    sport: "",
    team: "",
    person: "",
    taken_at: "",
    is_active: true,
  });

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return form.title.trim().length > 0 && !!file && !busy;
  }, [form.title, file, busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!file) {
      setMsg("Ajoute une image (watermarkée) avant de créer le produit.");
      return;
    }

    setBusy(true);
    try {
      // 1) create product
      const r1 = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          price: form.price,
          description: form.description || null,
          sport: form.sport || null,
          team: form.team || null,
          person: form.person || null,
          taken_at: form.taken_at || null,
          is_active: form.is_active,
          currency: "EUR",
        }),
      });

      if (!r1.ok) throw new Error(await r1.text());
      const { id } = await r1.json();

      // 2) upload image (FormData to avoid payload limit)
      const fd = new FormData();
      fd.append("image", file);

      const r2 = await fetch(`/api/admin/products/${id}/image`, {
        method: "POST",
        body: fd,
      });

      if (!r2.ok) throw new Error(await r2.text());

      setMsg("Produit créé ✅");
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {msg ? (
        <div className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-black/70">
          {msg}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Titre">
          <input
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
            placeholder="Ex: Finale — Paris vs …"
            required
          />
        </Field>

        <Field label="Prix (EUR)">
          <input
            value={form.price}
            onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
            inputMode="decimal"
            placeholder="8"
          />
        </Field>

        <Field label="Sport (catégorie)">
          <input
            value={form.sport}
            onChange={(e) => setForm((s) => ({ ...s, sport: e.target.value }))}
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
            placeholder="Basket, Foot…"
          />
        </Field>

        <Field label="Équipe">
          <input
            value={form.team}
            onChange={(e) => setForm((s) => ({ ...s, team: e.target.value }))}
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
            placeholder="PSG, Spurs…"
          />
        </Field>

        <Field label="Personne">
          <input
            value={form.person}
            onChange={(e) => setForm((s) => ({ ...s, person: e.target.value }))}
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
            placeholder="Nom du joueur / portrait…"
          />
        </Field>

        <Field label="Photo prise le…">
          <input
            value={form.taken_at}
            onChange={(e) =>
              setForm((s) => ({ ...s, taken_at: e.target.value }))
            }
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
            type="date"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((s) => ({ ...s, description: e.target.value }))
          }
          className="min-h-27.5 w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/20"
          placeholder="Infos, contexte, lieu, etc."
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-3 text-sm text-black/70">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) =>
              setForm((s) => ({ ...s, is_active: e.target.checked }))
            }
            className="h-4 w-4"
          />
          Actif (visible en boutique)
        </label>

        {/* File button stylé */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/80 transition hover:bg-black/3">
            {file ? "Image sélectionnée ✅" : "Choisir une image (watermarkée)"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-40"
          >
            {busy ? "Création…" : "Créer le produit"}
          </button>
        </div>
      </div>

      <p className="text-xs text-black/45">
        L’image doit déjà être watermarkée (flipagram). Elle sera utilisée
        partout : boutique, panier, page produit.
      </p>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
        {label}
      </div>
      {children}
    </div>
  );
}
