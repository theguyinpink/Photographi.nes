import Link from "next/link";
import { Shell } from "@/components/Shell";

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-black/60">
    <span className="h-1.5 w-1.5 rounded-full bg-black/60" />
    {children}
  </span>
);

export default function HomePage() {
  return (
    <Shell>
      {/* HERO */}
      <section className="bg-dots rounded-[28px] border border-black/10 bg-white/60 backdrop-blur mt-10">
        <div className="px-8 py-14 sm:px-14 sm:py-20">
          <div className="flex flex-wrap gap-2">
            <Tag>Sport</Tag>
            <Tag>Équipe</Tag>
            <Tag>Personne</Tag>
            <Tag>Preview protégé</Tag>
          </div>

          <div className="mt-10 max-w-4xl">
            <h1 className="text-[42px] leading-[1.03] tracking-[-0.05em] font-semibold sm:text-[64px]">
              Une galerie minimaliste.
              <br />
              Une boutique qui respire.
            </h1>

            <p className="mt-7 max-w-2xl text-[16px] leading-7 text-black/60 sm:text-[18px]">
              Les images sont au centre. Aperçu protégé (flipagram). Paiement carte.
              Envoi HD par email après achat.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
              >
                Explorer la galerie
              </Link>

              <Link
                href="/cart"
                className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-black/80 hover:bg-black/[0.03] transition"
              >
                Voir le panier
              </Link>

              <span className="text-xs text-black/45">
                Livraison : envoi email · Format HD
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION “Leen Heyne” vibe : 3 lignes simples, beaucoup d’air */}
      <section className="py-20 sm:py-28">
        <div className="grid gap-14 sm:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-black/40">Catégories</div>
            <div className="mt-4 text-lg font-semibold tracking-tight">Trouver vite.</div>
            <p className="mt-3 text-sm leading-6 text-black/60">Sport · Équipe · Personne</p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-black/40">Protection</div>
            <div className="mt-4 text-lg font-semibold tracking-tight">Preview sécurisé.</div>
            <p className="mt-3 text-sm leading-6 text-black/60">Flipagram sur chaque photo produit.</p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-black/40">Envoi</div>
            <div className="mt-4 text-lg font-semibold tracking-tight">HD par email.</div>
            <p className="mt-3 text-sm leading-6 text-black/60">Envoi manuel après validation de la commande.</p>
          </div>
        </div>
      </section>
    </Shell>
  );
}
