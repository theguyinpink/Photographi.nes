"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  title: string;
  price: string;
  sport: string;
  team: string;
  person: string;
  taken_at: string; // yyyy-mm-dd
  description: string;
};

export default function NewProductForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    title: "",
    price: "8.00",
    sport: "",
    team: "",
    person: "",
    taken_at: "",
    description: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim().length >= 2 &&
      Number(form.price) > 0 &&
      !!file
    );
  }, [form, file]);

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Ajoute une image watermarkée.");
      return;
    }

    setBusy(true);
    try {
      // 1) Créer le produit (sans image_url)
      const createRes = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          price: Number(form.price),
          sport: form.sport.trim() || null,
          team: form.team.trim() || null,
          person: form.person.trim() || null,
          taken_at: form.taken_at ? new Date(form.taken_at).toISOString() : null,
          description: form.description.trim() || null,
        }),
      });

      if (!createRes.ok) {
        const t = await createRes.text().catch(() => "Erreur");
        throw new Error(t);
      }

      const created = await createRes.json();
      const id: string | undefined = created?.id;
      if (!id) throw new Error("ID produit manquant.");

      // 2) Upload de l'image watermarkée
      const fd = new FormData();
      fd.append("image", file);

      const uploadRes = await fetch(`/api/admin/products/${id}/image`, {
        method: "POST",
        body: fd,
      });

      if (!uploadRes.ok) {
        const t = await uploadRes.text().catch(() => "Erreur upload");
        throw new Error(t);
      }

      // 3) Done -> retour liste admin
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-[28px] border border-black/10 bg-white p-7 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="mb-7">
          <div className="text-xs uppercase tracking-[0.22em] text-black/40">
            Admin • Nouveau produit
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black">
            Ajouter une photo
          </h1>
          <p className="mt-2 text-sm text-black/60">
            Upload 1 seule image déjà watermarkée. Elle sera affichée partout (boutique, panier, produit).
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titre">
              <Input
                value={form.title}
                onChange={(e) => onChange("title", e.target.value)}
                placeholder="Ex: Charlène Carré"
              />
            </Field>

            <Field label="Prix (EUR)">
              <Input
                value={form.price}
                onChange={(e) => onChange("price", e.target.value)}
                inputMode="decimal"
                placeholder="8.00"
              />
            </Field>

            <Field label="Sport / Événement">
              <Input
                value={form.sport}
                onChange={(e) => onChange("sport", e.target.value)}
                placeholder="Ex: Basket"
              />
            </Field>

            <Field label="Équipe">
              <Input
                value={form.team}
                onChange={(e) => onChange("team", e.target.value)}
                placeholder="Ex: Paris Basketball"
              />
            </Field>

            <Field label="Personne">
              <Input
                value={form.person}
                onChange={(e) => onChange("person", e.target.value)}
                placeholder="Ex: TJ Shorts"
              />
            </Field>

            <Field label="Photo prise le">
              <Input
                type="date"
                value={form.taken_at}
                onChange={(e) => onChange("taken_at", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Quelques mots sur la photo, le contexte…"
              className="min-h-27.5 w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black/30"
            />
          </Field>

          {/* Upload */}
          <div className="rounded-2xl border border-black/10 bg-black/2 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-medium text-black">
                  Image watermarkée
                </div>
                <div className="text-xs text-black/55">
                  PNG/JPG — déjà filigranée (logo répété). C’est celle qui sera affichée sur le site.
                </div>
              </div>

              <label className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm shadow-sm transition hover:border-black/20 hover:bg-black hover:text-white">
                <span className="font-medium">
                  {file ? "Changer l’image" : "Choisir un fichier"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {file ? (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-black">
                    {file.name}
                  </div>
                  <div className="text-xs text-black/50">
                    {(file.size / (1024 * 1024)).toFixed(2)} Mo
                  </div>
                </div>
                <div className="text-xs text-black/40">Prêt</div>
              </div>
            ) : null}
          </div>

          {/* Error */}
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm text-black shadow-sm transition hover:border-black/20"
            >
              Retour
            </button>

            <button
              type="submit"
              disabled={!canSubmit || busy}
              className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Création…" : "Créer le produit"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <label className="block">
      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-black/40">
        {label}
      </div>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-black",
        "outline-none transition focus:border-black/30",
        props.className ?? "",
      ].join(" ")}
    />
  );
}
