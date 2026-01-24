"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Options = {
  sports: string[];
  teams: string[];
  categories: string[];
  persons: string[];
};

function clean(v: string) {
  return v.trim();
}

export default function Filters({ options }: { options: Options }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [open, setOpen] = useState(false);

  const current = useMemo(() => {
    return {
      sport: sp.get("sport") ?? "",
      team: sp.get("team") ?? "",
      category: sp.get("category") ?? "",
      person: sp.get("person") ?? "",
    };
  }, [sp]);

  function apply(next: typeof current) {
    const params = new URLSearchParams(sp.toString());

    (["sport", "team", "category", "person"] as const).forEach((k) => {
      const val = clean(next[k]);
      if (!val) params.delete(k);
      else params.set(k, val);
    });

    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  function clearAll() {
    const params = new URLSearchParams(sp.toString());
    ["sport", "team", "category", "person"].forEach((k) => params.delete(k));
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  const activeCount =
    (current.sport ? 1 : 0) +
    (current.team ? 1 : 0) +
    (current.category ? 1 : 0) +
    (current.person ? 1 : 0);

  const [draft, setDraft] = useState(current);

  // sync draft when URL changes
  // (simple: reset when opening)
  function openModal() {
    setDraft(current);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black/80 transition hover:bg-black/3"
      >
        Filtres{activeCount > 0 ? ` · ${activeCount}` : ""}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-1/2 top-1/2 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-xl">
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-black/40">
                    Boutique
                  </div>
                  <div className="mt-2 text-xl font-semibold tracking-tight">
                    Filtres
                  </div>
                  <div className="mt-2 text-sm text-black/55">
                    Choisis ce que tu veux afficher.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-black/10 px-3 py-2 text-sm text-black/70 hover:bg-black/3"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Select
                  label="Sport"
                  value={draft.sport}
                  onChange={(v) => setDraft((p) => ({ ...p, sport: v }))}
                  options={options.sports}
                />
                <Select
                  label="Équipe"
                  value={draft.team}
                  onChange={(v) => setDraft((p) => ({ ...p, team: v }))}
                  options={options.teams}
                />
                <Select
                  label="Catégorie"
                  value={draft.category}
                  onChange={(v) => setDraft((p) => ({ ...p, category: v }))}
                  options={options.categories}
                />
                <Select
                  label="Personne"
                  value={draft.person}
                  onChange={(v) => setDraft((p) => ({ ...p, person: v }))}
                  options={options.persons}
                />
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black/70 transition hover:bg-black/3"
                >
                  Réinitialiser
                </button>

                <button
                  type="button"
                  onClick={() => apply(draft)}
                  className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/90"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.2em] text-black/45">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm text-black/80 outline-none transition focus:border-black/20"
      >
        <option value="">Tous</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
