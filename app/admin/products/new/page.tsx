import { requireAdmin } from "@/lib/requireAdmin";
import NewProductForm from "./NewProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <NewProductForm />
    </main>
  );
}
