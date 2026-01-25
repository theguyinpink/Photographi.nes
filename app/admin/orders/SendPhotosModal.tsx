"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

type Item = { id: string; qty?: number };

type ProductsMap = Record<
  string,
  { id: string; title: string; image_url: string | null }
>;

export default function SendPhotosModal({
  open,
  onClose,
  order,
  items,
  productsMap,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  order: { id: string; email: string | null };
  items: Item[];
  productsMap: ProductsMap;
  onSent: (payload: { status: string; sent_at: string | null }) => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const to = order.email ?? "";

  // Références de la commande (pour aider Inès à savoir quoi envoyer)
  const refs = useMemo(() => {
    const normalized = Array.isArray(items) ? items : [];
    const expanded: Item[] = [];
    for (const it of normalized) {
      const qty = Math.max(1, it.qty ?? 1);
      for (let i = 0; i < qty; i++) expanded.push({ id: it.id, qty: 1 });
    }
    return expanded;
  }, [items]);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    setSubject(`Vos photos PhotographI.nes (commande ${order.id})`);
    setMessage(`Bonjour,\n\nMerci pour votre achat ! Voici vos photos :\n`);
    setFiles([]);

    // reset input file (sinon parfois il garde l’ancien état)
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, order.id]);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const arr = Array.from(e.target.files ?? []);
    setFiles(arr);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    // on ne peut pas enlever un fichier de l'input directement,
    // mais comme on envoie via FormData à partir de state, c'est ok.
  }

  async function submit() {
    if (!to.trim()) {
      toast.error("Cette commande n’a pas d’email.", "Envoi");
      return;
    }
    if (files.length === 0) {
      toast.error("Ajoute au moins un fichier.", "Envoi");
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("subject", subject);
      fd.append("message", message);
      for (const f of files) fd.append("files", f);

      const res = await fetch(`/api/admin/orders/${order.id}/send`, {
        method: "POST",
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any)?.error ?? "Erreur d’envoi");

      toast.success("Email envoyé ✅", "Commandes");
      onSent({
        status: (json as any).order.status,
        sent_at: (json as any).order.sent_at ?? null,
      });
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Impossible d’envoyer", "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const filesLabel =
    files.length === 0
      ? "Aucun fichier sélectionné"
      : files.length === 1
      ? "1 fichier sélectionné"
      : `${files.length} fichiers sélectionnés`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-3xl rounded-[28px] border border-black/10 bg-white shadow-xl">
        <div className="p-6">
          <div className="text-sm font-semibold text-black/80">
            Envoyer les photos (manuel)
          </div>
          <div className="mt-1 text-xs text-black/45">
            Commande <span className="font-mono">{order.id}</span>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-black/45">
                À
              </label>
              <input
                value={to}
                disabled
                className="mt-1 w-full rounded-2xl border border-black/10 bg-black/2 px-4 py-2 text-sm text-black/70"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-black/45">
                Objet
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-black/45">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              />
            </div>

            {/* ✅ Références de commande (aide Inès) */}
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-black/45">
                Photos dans la commande (référence)
              </label>

              <div className="mt-2 rounded-2xl border border-black/10 bg-white p-4">
                <div className="text-xs text-black/55">
                  Cette liste sert juste à t’aider à savoir quelles photos il faut
                  envoyer. Tu ajoutes ensuite les fichiers ci-dessous.
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  {refs.length === 0 ? (
                    <div className="text-xs text-black/40">—</div>
                  ) : (
                    refs.map((it, idx) => {
                      const p = productsMap[it.id];
                      return (
                        <div
                          key={`${it.id}-${idx}`}
                          className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2"
                        >
                          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-black/10 bg-black/2">
                            {p?.image_url ? (
                              <Image
                                src={p.image_url}
                                alt={p?.title ?? "Photo"}
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
                            <div className="truncate font-mono text-[11px] text-black/35">
                              {it.id}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ✅ Upload manuel — bouton FR */}
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-black/45">
                Fichiers à envoyer (Inès ajoute ici)
              </label>

              <div className="mt-2 rounded-2xl border border-black/10 bg-white p-4">
                <div className="text-xs text-black/55">
                  Ajoute les fichiers correspondant à cette commande.
                  <br />
                  Conseil : si possible, renomme les fichiers avant (ex :
                  <span className="font-mono"> commande-{order.id}-1.jpg</span>).
                </div>

                {/* input caché */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={onPickFiles}
                />

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={busy}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black/75 hover:bg-black/3 disabled:opacity-50"
                  >
                    Choisir des fichiers
                  </button>

                  <div className="text-xs text-black/55">{filesLabel}</div>
                </div>

                {/* liste des fichiers */}
                {files.length > 0 ? (
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-black/70">
                      Fichiers sélectionnés
                    </div>

                    <div className="mt-2 flex flex-col gap-2">
                      {files.map((f, idx) => (
                        <div
                          key={`${f.name}-${f.size}-${idx}`}
                          className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm text-black/75">
                              {f.name}
                            </div>
                            <div className="text-[11px] text-black/45 font-mono">
                              {Math.round((f.size / 1024 / 1024) * 100) / 100} MB
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            disabled={busy}
                            className="ml-auto rounded-2xl border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/70 hover:bg-black/3 disabled:opacity-50"
                          >
                            Retirer
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={busy}
              className="rounded-2xl border border-black/10 bg-white px-5 py-2 text-sm font-semibold text-black/70 hover:bg-black/3"
            >
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="rounded-2xl bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
