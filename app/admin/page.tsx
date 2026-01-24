import Link from "next/link";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function AdminHome() {
  await requireAdmin();

  return (
    <div className="py-12">
      <div className="text-xs uppercase tracking-[0.22em] text-black/40">
        Admin
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Tableau de bord
      </h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/products"
          className="rounded-3xl border border-black/10 bg-white p-6 hover:bg-black/3"
        >
          <div className="text-sm font-semibold">Produits</div>
          <div className="mt-2 text-sm text-black/60">
            Ajouter / éditer des photos, prix, catégories…
          </div>
        </Link>

        <Link
          href="/admin/orders"
          className="rounded-3xl border border-black/10 bg-white p-6 hover:bg-black/3"
        >
          <div className="text-sm font-semibold">Commandes</div>
          <div className="mt-2 text-sm text-black/60">
            Voir les achats et envoyer les originaux.
          </div>
        </Link>
      </div>
    </div>
  );
}
