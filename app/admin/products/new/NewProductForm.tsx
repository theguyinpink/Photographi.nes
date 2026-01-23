"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label className="text-sm font-semibold">{label}</label>
        {hint ? <span className="text-xs text-black/40">{hint}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/30 " +
        (props.className ?? "")
      }
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "w-full min-h-30 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/30 " +
        (props.className ?? "")
      }
    />
  );
}

export default function NewProductForm() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [priceEUR, setPriceEUR] = useState("0.00");
  const [isActive, setIsActive] = useState(true);

  const [sport, setSport] = useState("");
  const [team, setTeam] = useState("");
  const [person, setPerson] = useState("");
  const [takenAt, setTakenAt] = useState("");
  const [description, setDescription] = useState("");

  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [flipFile, setFlipFile] = useState<File | null>(null);

  const priceCents = useMemo(() => {
    const v = Number(String(priceEUR).replace(",", "."));
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.round(v * 100));
  }, [priceEUR]);

  async function uploadThumbAndFlip() {
    if (!thumbFile || !flipFile) {
      throw new Error("Il faut choisir un thumbnail + un flipagram.");
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("thumbnail", thumbFile);
    fd.append("flipagram", flipFile);

    const r = await fetch("/api/admin/uploads", { method: "POST", body: fd });
    setUploading(false);

    if (!r.ok) throw new Error(await r.text());
    return (await r.json()) as { thumbnail_url: string; flipagram_url: string };
  }

  async function createProduct() {
    setCreating(true);

    try {
      // 1) upload images -> urls
      const { thumbnail_url, flipagram_url } = await uploadThumbAndFlip();

      // 2) create product in DB
      const r = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Sans titre",
          price_cents: priceCents,
          is_active: isActive,
          sport: sport.trim() || null,
          team: team.trim() || null,
          person: person.trim() || null,
          taken_at: takenAt || null,
          description: description.trim() || null,
          thumbnail_url,
          flipagram_url,
        }),
      });

      if (!r.ok) {
        throw new Error(await r.text());
      }

      const data = await r.json();
      if (!data?.id || typeof data.id !== "string") {
        console.error("API response:", data);
        throw new Error(
          "Création OK mais l'ID est manquant. Vérifie POST /api/admin/products.",
        );
      }
      router.push(`/admin/products/${data.id}`);
      router.refresh(); // ✅ force re-fetch des Server Components
    } catch (e: any) {
      alert(e?.message ?? "Erreur création");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Aperçu */}
      <div className="lg:col-span-5">
        <div className="rounded-[28px] border border-black/10 bg-white p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-black/40">
            Images
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <div className="text-sm font-semibold">Thumbnail (boutique)</div>
              <p className="mt-1 text-xs text-black/40">
                L’image nette utilisée dans la grille.
              </p>
              <div className="mt-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">
                Flipagram (aperçu protégé)
              </div>
              <p className="mt-1 text-xs text-black/40">
                L’image watermarkée affichée sur le site.
              </p>
              <div className="mt-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFlipFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            {uploading ? (
              <div className="text-xs text-black/50">Upload en cours…</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="lg:col-span-7">
        <div className="rounded-[28px] border border-black/10 bg-white p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-black/40">
            Infos
          </div>

          <div className="mt-6 grid gap-6">
            <Field label="Titre">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Prix (€)">
                <Input
                  value={priceEUR}
                  onChange={(e) => setPriceEUR(e.target.value)}
                />
              </Field>

              <Field label="Statut" hint="visible dans la boutique">
                <button
                  type="button"
                  onClick={() => setIsActive((v) => !v)}
                  className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold ${
                    isActive
                      ? "bg-black text-white"
                      : "border border-black/10 bg-black/3 text-black/70"
                  }`}
                >
                  {isActive ? "Actif" : "Inactif"}
                </button>
              </Field>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <Field label="Sport" hint="ex: Basket">
                <Input
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                />
              </Field>
              <Field label="Équipe" hint="ex: PSG">
                <Input value={team} onChange={(e) => setTeam(e.target.value)} />
              </Field>
              <Field label="Personne" hint="ex: Wembanyama">
                <Input
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Photo prise le">
              <Input
                type="date"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
              />
            </Field>

            <Field label="Description" hint="affichée sur la page produit">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={createProduct}
                disabled={creating}
                className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {creating ? "Création…" : "Créer le produit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
