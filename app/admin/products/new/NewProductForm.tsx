"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { AdminImageDropzone } from "@/components/ui/AdminImageDropzone";

type FormState = {
  title: string;
  price: string; // euros
  sport: string;
  team: string;
  category: string;
  person: string;
  taken_at: string; // yyyy-mm-dd
  description: string;
  is_active: boolean;
};

type Step = "idle" | "creating" | "uploading" | "saving" | "done";

export default function NewProductForm() {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState<FormState>({
    title: "",
    price: "8.00",
    sport: "",
    team: "",
    category: "",
    person: "",
    taken_at: "",
    description: "",
    is_active: true,
  });

  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const busy = step !== "idle" && step !== "done";
  const [error, setError] = useState<string | null>(null);

  const dirty = useMemo(() => {
    return (
      form.title.trim().length > 0 ||
      form.price.trim() !== "8.00" ||
      form.sport.trim().length > 0 ||
      form.team.trim().length > 0 ||
      form.category.trim().length > 0 ||
      form.person.trim().length > 0 ||
      form.taken_at.trim().length > 0 ||
      form.description.trim().length > 0 ||
      form.is_active !== true ||
      !!file
    );
  }, [form, file]);

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
    return form.title.trim().length >= 2 && Number(form.price) > 0 && !!file && !busy;
  }, [form.title, form.price, file, busy]);

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function createProduct(): Promise<string> {
    const createRes = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        price: Number(form.price),
        currency: "EUR",
        description: form.description.trim() || null,

        sport: form.sport.trim() || null,
        team: form.team.trim() || null,
        category: form.category.trim() || null,
        person: form.person.trim() || null,

        taken_at: form.taken_at ? new Date(form.taken_at).toISOString() : null,
        is_active: form.is_active,
      }),
    });

    if (!createRes.ok) throw new Error(await createRes.text());
    const created = await createRes.json();
    const id: string | undefined = created?.id;
    if (!id) throw new Error("ID produit manquant.");
    return id;
  }

  async function uploadToSupabaseSignedUrl(productId: string, f: File): Promise<string> {
    // 1) demander une signed upload url à notre API (admin only)
    const r = await fetch(`/api/admin/products/${productId}/image`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: f.name,
        contentType: f.type || "application/octet-stream",
      }),
    });

    if (!r.ok) throw new Error(await r.text());
    const { signedUrl, publicUrl } = await r.json();

    // 2) upload direct vers Supabase via PUT (pas via Vercel)
    const up = await fetch(signedUrl, {
      method: "PUT",
      headers: { "content-type": f.type || "application/octet-stream" },
      body: f,
    });

    if (!up.ok) throw new Error(`Upload Supabase failed (${up.status})`);

    return publicUrl as string;
  }

  async function saveImageUrl(productId: string, publicUrl: string) {
    const patch = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image_url: publicUrl }),
    });

    if (!patch.ok) throw new Error(await patch.text());
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      const msg = "Ajoute une image watermarkée avant de créer le produit.";
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setStep("creating");

      // 1) create product
      const id = await createProduct();

      // 2) upload image via signed URL
      setStep("uploading");
      const publicUrl = await uploadToSupabaseSignedUrl(id, file);

      // 3) save image_url in DB
      setStep("saving");
      await saveImageUrl(id, publicUrl);

      setStep("done");
      toast.success("Produit créé + image uploadée ✅", "OK");

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      const msg = err?.message || "Une erreur est survenue.";
      setError(msg);
      toast.error(msg, "Erreur");
      setStep("idle");
    }
  }

  const statusLabel =
    step === "creating"
      ? "Création du produit…"
      : step === "uploading"
        ? "Upload de l’image…"
        : step === "saving"
          ? "Sauvegarde…"
          : "";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Nouveau produit</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Une image watermarkée, une fiche clean, et c’est parti.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-zinc-900">Titre</label>
              <input
                value={form.title}
                onChange={(e) => onChange("title", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Ex: Dunk — Paris Basketball"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">Prix (€)</label>
              <input
                inputMode="decimal"
                value={form.price}
                onChange={(e) => onChange("price", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="8.00"
              />
            </div>

            <div className="flex items-end gap-3">
              <label className="flex-1">
                <div className="text-sm font-medium text-zinc-900">Date (optionnel)</div>
                <input
                  type="date"
                  value={form.taken_at}
                  onChange={(e) => onChange("taken_at", e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </label>

              <label className="mb-1 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => onChange("is_active", e.target.checked)}
                />
                Actif
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">Sport (optionnel)</label>
              <input
                value={form.sport}
                onChange={(e) => onChange("sport", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Basket, Foot…"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">Équipe (optionnel)</label>
              <input
                value={form.team}
                onChange={(e) => onChange("team", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="PSG, Paris Basketball…"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">Catégorie (optionnel)</label>
              <input
                value={form.category}
                onChange={(e) => onChange("category", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Dunk / Défense / Portrait…"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">Personne (optionnel)</label>
              <input
                value={form.person}
                onChange={(e) => onChange("person", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Wembanyama…"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-zinc-900">Description (optionnel)</label>
              <textarea
                value={form.description}
                onChange={(e) => onChange("description", e.target.value)}
                className="mt-1 min-h-30 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
                placeholder="Quelques lignes…"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <AdminImageDropzone
            label="Image du produit"
            required
            help="PNG/JPG — watermark déjà appliqué"
            value={file}
            onChange={(f) => setFile(f)}
            maxSizeMb={15}
            onError={(m) => toast.error(m)}
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
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
              {busy ? "En cours…" : "Créer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
