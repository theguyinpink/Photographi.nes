import { requireAdmin } from "@/lib/requireAdmin";
import NewProductForm from "./NewProductForm";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  await requireAdmin();

  return (
    <div className="py-12">
      <div className="text-xs uppercase tracking-[0.22em] text-black/40">
        Admin · Produits
      </div>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Nouveau produit
      </h1>

      <p className="mt-3 text-sm text-black/60">
        Ajoute les infos + les images (thumbnail et flipagram), puis publie.
      </p>

      <div className="mt-10">
        <NewProductForm />
      </div>
    </div>
  );
}
