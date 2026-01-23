"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  price_cents: number;
  is_active: boolean;
  description: string | null;
  sport: string | null;
  team: string | null;
  person: string | null;
  taken_at: string | null;
  thumbnail_url: string | null;
  flipagram_url: string | null;
};

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

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState(product.title ?? "");
  const [priceEUR, setPriceEUR] = useState((product.price_cents / 100).toFixed(2));
  const [isActive, setIsActive] = useState(!!product.is_active);

  const [sport, setSport] = useState(product.sport ?? "");
  const [team, setTeam] = useState(product.team ?? "");
  const [person, setPerson] = useState(product.person ?? "");
  const [takenAt, setTakenAt] = useState(product.taken_at ?? "");
  const [description, setDescription] = useState(product.description ?? "");

  const priceCents = useMemo(() => {
    const v = Number(String(priceEUR).replace(",", "."));
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.round(v * 100));
  }, [priceEUR]);

  async function save() {
    setSaving(true);

    const r = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        price_cents: priceCents,
        is_active: isActive,
        sport: sport.trim() || null,
        team: team.trim() || null,
        person: person.trim() || null,
        taken_at: takenAt || null,
        description: description.trim() || null,
      }),
    });

    setSaving(false);

    if (!r.ok) {
      const t = await r.text();
      alert(t || "Erreur sauvegarde");
      return;
    }

    router.refresh();
  }

  async function uploadOriginal(file: File) {
    setUploading(true);

    const fd = new FormData();
    fd.append("original", file);

    const r = await fetch(`/api/admin/products/${product.id}/images`, {
      method: "POST",
      body: fd,
    });

    setUploading(false);

    if (!r.ok) {
      const t = await r.text();
      alert(t || "Erreur upload");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Colonne gauche : aperçu */}
      <div className="lg:col-span-5">
        <div className="rounded-[28px] border border-black/10 bg-white p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-black/40">
            Aperçu
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-black/2 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.flipagram_url || product.thumbnail_url || ""}
              alt={title}
              className="w-full h-auto object-contain"
            />
          </div>

          <div className="mt-5 grid gap-3">
            <div className="text-sm font-semibold">{title || "Sans titre"}</div>
            <div className="text-sm text-black/60">
              Prix: <span className="font-semibold">{(priceCents / 100).toFixed(2)} €</span>
              {" · "}
              Statut: <span className="font-semibold">{isActive ? "Actif" : "Inactif"}</span>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-semibold">Upload original</label>
            <p className="mt-1 text-xs text-black/40">
              On génère automatiquement le thumbnail + flipagram.
            </p>

            <div className="mt-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadOriginal(f);
                }}
              />
              {uploading ? (
                <div className="mt-2 text-xs text-black/50">Upload en cours…</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Colonne droite : formulaire */}
      <div className="lg:col-span-7">
        <div className="rounded-[28px] border border-black/10 bg-white p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-black/40">
            Détails
          </div>

          <div className="mt-6 grid gap-6">
            <Field label="Titre">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Prix (€)" hint="sera converti en centimes">
                <Input value={priceEUR} onChange={(e) => setPriceEUR(e.target.value)} />
              </Field>

              <Field label="Actif" hint="visible dans la boutique">
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
                <Input value={sport} onChange={(e) => setSport(e.target.value)} />
              </Field>
              <Field label="Équipe" hint="ex: PSG">
                <Input value={team} onChange={(e) => setTeam(e.target.value)} />
              </Field>
              <Field label="Personne" hint="ex: Wembanyama">
                <Input value={person} onChange={(e) => setPerson(e.target.value)} />
              </Field>
            </div>

            <Field label="Date (shoot)">
              <Input
                type="date"
                value={takenAt || ""}
                onChange={(e) => setTakenAt(e.target.value)}
              />
            </Field>

            <Field label="Description" hint="affichée sur la page produit">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Sauvegarde…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
