"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  price_cents: number;
  currency: string | null;
  image_url: string | null;
  description: string | null;
  sport: string | null;
  team: string | null;
  person: string | null;
  taken_at: string | null;
  is_active: boolean;
};

type FormState = {
  title: string;
  price: string; // euros (string for input)
  description: string;
  sport: string;
  team: string;
  person: string;
  taken_at: string; // yyyy-mm-dd
  is_active: boolean;
};

export default function EditProductForm({ product }: { product?: Product | null }) {
  const router = useRouter();

  const isEdit = !!product?.id;

  const [form, setForm] = useState<FormState>(() => ({
    title: product?.title ?? "",
    price: product ? String((product.price_cents ?? 0) / 100) : "8",
    description: product?.description ?? "",
    sport: product?.sport ?? "",
    team: product?.team ?? "",
    person: product?.person ?? "",
    taken_at: product?.taken_at ? String(product.taken_at).slice(0, 10) : "",
    is_active: product?.is_active ?? true,
  }));

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const canSubmit = useMemo(() => {
    const hasTitle = form.title.trim().length > 0;
    const hasPrice = String(form.price).trim().length > 0;
    const needsFile = !isEdit; // en création : image obligatoire
    return hasTitle && hasPrice && !busy && (!needsFile || !!file);
  }, [form.title, form.price, busy, file, isEdit]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function createProduct(): Promise<string> {
    const r = await fetch("/api/admin/products", {
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

    if (!r.ok) throw new Error(await r.text());
    const { id } = await r.json();
    if (!id) throw new Error("API: id manquant après création.");
    return id as string;
  }

  async function updateProduct(id: string) {
    const r = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
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

    if (!r.ok) throw new Error(await r.text());
  }

  async function uploadImage(id: string) {
    if (!file) return;

    const fd = new FormData();
    fd.append("image", file); // ✅ clé = image

    const r = await fetch(`/api/admin/products/${id}/image`, {
      method: "POST",
      body: fd,
    });

    if (!r.ok) throw new Error(await r.text());
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!isEdit && !file) {
      setMsg("Ajoute une image (déjà watermarkée) avant de créer le produit.");
      return;
    }

    setBusy(true);
    try {
      let id = product?.id;

      if (!isEdit) {
        // NEW
        id = await createProduct();
        await uploadImage(id);
        setMsg("Produit créé ✅");
      } else {
        // EDIT
        await updateProduct(id!);
        // image optionnelle en édition
        if (file) await uploadImage(id!);
        setMsg("Modifications enregistrées ✅");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {msg ? (
        <div className="rounded-3xl border border-black/10 bg-white px-5 py-4 text-sm text-black/70">
          {msg}
        </div>
      ) : null}

      {/* Card principale */}
      <div className="rounded-[28px] border border-black/10 bg-white p-6 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-black/40">
              {isEdit ? "Édition produit" : "Nouveau produit"}
            </div>
            <div className="text-xl font-semibold tracking-tight text-black/85">
              {isEdit ? "Mettre à jour la fiche" : "Créer une nouvelle fiche"}
            </div>
            <div className="text-sm text-black/55">
              Une seule image watermarkée sera utilisée partout (boutique, panier, fiche produit).
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-3 text-sm text-black/70">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
                className="h-4 w-4"
              />
              Actif (visible)
            </label>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Titre">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
              placeholder="Ex: Finale — Paris vs …"
              required
            />
          </Field>

          <Field label="Prix (EUR)">
            <input
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
              inputMode="decimal"
              placeholder="8"
            />
          </Field>

          <Field label="Sport">
            <input
              value={form.sport}
              onChange={(e) => set("sport", e.target.value)}
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
              placeholder="Basket, Foot…"
            />
          </Field>

          <Field label="Équipe">
            <input
              value={form.team}
              onChange={(e) => set("team", e.target.value)}
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
              placeholder="PSG, Spurs…"
            />
          </Field>

          <Field label="Personne">
            <input
              value={form.person}
              onChange={(e) => set("person", e.target.value)}
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
              placeholder="Nom du joueur / portrait…"
            />
          </Field>

          <Field label="Photo prise le…">
            <input
              value={form.taken_at}
              onChange={(e) => set("taken_at", e.target.value)}
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
              type="date"
            />
          </Field>
        </div>

        <div className="mt-6">
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-30 w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/20"
              placeholder="Infos, contexte, lieu, etc."
            />
          </Field>
        </div>

        {/* Upload section */}
        <div className="mt-7 rounded-3xl border border-black/10 bg-black/2 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-black/80">Image (watermarkée)</div>
              <div className="mt-1 text-xs text-black/55">
                {isEdit
                  ? "Optionnel : tu peux remplacer l’image (sinon on garde l’actuelle)."
                  : "Obligatoire : ajoute une image déjà watermarkée (flipagram)."}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="group inline-flex cursor-pointer items-center justify-center rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/80 transition hover:bg-black/3">
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-black/60">
                  +
                </span>
                {file ? "Fichier prêt ✅" : "Choisir un fichier"}
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
                {busy ? "En cours…" : isEdit ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>

          {/* preview */}
          <div className="mt-5">
            <div className="rounded-[22px] border border-black/10 bg-white p-3">
              <div className="text-xs uppercase tracking-[0.18em] text-black/40">
                Aperçu
              </div>

              <div className="mt-3 overflow-hidden rounded-[18px] border border-black/10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl ?? product?.image_url ?? "/logo-ines.png"}
                  alt="preview"
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="mt-3 text-xs text-black/55">
                {file
                  ? `Fichier sélectionné : ${file.name}`
                  : product?.image_url
                  ? "Image actuelle enregistrée."
                  : "Aucune image pour l’instant."}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 text-xs text-black/45">
          Astuce : pour éviter tout vol, ne téléverse que des images déjà watermarkées.
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
        {label}
      </div>
      {children}
    </div>
  );
}
