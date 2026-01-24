"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { AdminImageDropzone } from "@/components/ui/AdminImageDropzone";

type Product = {
  id: string;
  title: string;
  price_cents: number;
  currency: string | null;
  image_url: string | null;
  description: string | null;

  sport: string | null;
  team: string | null;
  category: string | null;
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
  category: string;
  person: string;

  taken_at: string; // yyyy-mm-dd
  is_active: boolean;
};

type Step = "idle" | "saving" | "uploading";

export default function EditProductForm({ product }: { product?: Product | null }) {
  const router = useRouter();
  const toast = useToast();

  const isEdit = !!product?.id;

  const initial = useMemo<FormState>(
    () => ({
      title: product?.title ?? "",
      price: product ? String((product.price_cents ?? 0) / 100) : "8",
      description: product?.description ?? "",

      sport: product?.sport ?? "",
      team: product?.team ?? "",
      category: product?.category ?? "",
      person: product?.person ?? "",

      taken_at: product?.taken_at ? String(product.taken_at).slice(0, 10) : "",
      is_active: product?.is_active ?? true,
    }),
    [product]
  );

  const [form, setForm] = useState<FormState>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const busy = step !== "idle";
  const [inlineMsg, setInlineMsg] = useState<string | null>(null);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const dirty = useMemo(() => {
    const changed =
      form.title !== initial.title ||
      form.price !== initial.price ||
      form.description !== initial.description ||
      form.sport !== initial.sport ||
      form.team !== initial.team ||
      form.category !== initial.category ||
      form.person !== initial.person ||
      form.taken_at !== initial.taken_at ||
      form.is_active !== initial.is_active;

    return changed || !!file;
  }, [form, initial, file]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty || busy) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, busy]);

  const canSubmit = useMemo(() => {
    const hasTitle = form.title.trim().length > 0;
    const hasPrice =
      String(form.price).trim().length > 0 && Number(form.price) > 0;

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
        title: form.title.trim(),
        price: Number(form.price),
        description: form.description.trim() || null,

        sport: form.sport.trim() || null,
        team: form.team.trim() || null,
        category: form.category.trim() || null,
        person: form.person.trim() || null,

        taken_at: form.taken_at ? new Date(form.taken_at).toISOString() : null,
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
        title: form.title.trim(),
        price: Number(form.price),
        description: form.description.trim() || null,

        sport: form.sport.trim() || null,
        team: form.team.trim() || null,
        category: form.category.trim() || null,
        person: form.person.trim() || null,

        taken_at: form.taken_at ? new Date(form.taken_at).toISOString() : null,
        is_active: form.is_active,
        currency: "EUR",
      }),
    });

    if (!r.ok) throw new Error(await r.text());
  }

async function uploadImage(id: string) {
  if (!file) return;

  setStep("uploading");

  // 1) demande une signed upload url au serveur
  const r = await fetch(`/api/admin/products/${id}/image`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    }),
  });

  if (!r.ok) throw new Error(await r.text());
  const { signedUrl, publicUrl } = await r.json();

  // 2) upload direct vers Supabase via PUT
  const up = await fetch(signedUrl, {
    method: "PUT",
    headers: { "content-type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!up.ok) throw new Error(`Upload Supabase failed (${up.status})`);

  // 3) patch image_url dans products
  const patch = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image_url: publicUrl }),
  });

  if (!patch.ok) throw new Error(await patch.text());
}






  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInlineMsg(null);

    if (!isEdit && !file) {
      const msg = "Ajoute une image (déjà watermarkée) avant de créer le produit.";
      setInlineMsg(msg);
      toast.error(msg);
      return;
    }

    setStep("saving");
    try {
      let id = product?.id;

      if (!isEdit) {
        id = await createProduct();
      } else if (id) {
        await updateProduct(id);
      } else {
        throw new Error("Produit introuvable.");
      }

      // upload image seulement si besoin
      await uploadImage(id);

      toast.success(isEdit ? "Produit mis à jour ✅" : "Produit créé ✅");
      setFile(null);

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      const msg = err?.message || "Une erreur est survenue.";
      setInlineMsg(msg);
      toast.error(msg, "Erreur");
    } finally {
      setStep("idle");
    }
  }

  const statusLabel =
    step === "saving"
      ? "Sauvegarde…"
      : step === "uploading"
      ? "Upload image…"
      : "";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            {isEdit ? "Modifier le produit" : "Nouveau produit"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isEdit
              ? "Modifie la fiche et/ou remplace l’image."
              : "Crée le produit puis upload l’image."}
          </p>
        </div>

        {dirty ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600">
            Modifications non sauvegardées
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-zinc-900">Titre</label>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Ex: Dunk — Paris Basketball"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">Prix (€)</label>
              <input
                inputMode="decimal"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>

            <div className="flex items-end gap-3">
              <label className="flex-1">
                <div className="text-sm font-medium text-zinc-900">Date (optionnel)</div>
                <input
                  type="date"
                  value={form.taken_at}
                  onChange={(e) => set("taken_at", e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </label>

              <label className="mb-1 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                />
                Actif
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">Sport (optionnel)</label>
              <input
                value={form.sport}
                onChange={(e) => set("sport", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Ex: Basket"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">Équipe (optionnel)</label>
              <input
                value={form.team}
                onChange={(e) => set("team", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Ex: Seine-Essonne BasketBall"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">Catégorie (optionnel)</label>
              <input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Ex: U13/Argent/Seniors…"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">Personne (optionnel)</label>
              <input
                value={form.person}
                onChange={(e) => set("person", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Ex: Charlène Carré/Numéro 8"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-zinc-900">Description (optionnel)</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="mt-1 min-h-30 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <AdminImageDropzone
            label="Image du produit"
            required={!isEdit}
            help={
              isEdit
                ? "Glisse pour remplacer — sinon on garde l’image actuelle"
                : "Obligatoire en création"
            }
            initialUrl={product?.image_url}
            value={file}
            onChange={(f) => setFile(f)}
            maxSizeMb={15}
            onError={(m) => toast.error(m)}
          />
        </div>

        {inlineMsg ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {inlineMsg}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            onClick={() => router.push("/admin/products")}
            disabled={busy}
          >
            Retour
          </button>

          <div className="flex items-center gap-3">
            {busy ? <div className="text-sm text-zinc-500">{statusLabel}</div> : null}
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-2xl bg-zinc-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "En cours…" : isEdit ? "Sauvegarder" : "Créer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
