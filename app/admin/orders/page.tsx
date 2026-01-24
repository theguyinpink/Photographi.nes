import { Shell } from "@/components/Shell";
import { createClient } from "@supabase/supabase-js";
import OrdersTable from "./OrdersTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type OrderRow = {
  id: string;
  status: string | null;
  total_cents: number | null;
  currency: string | null;
  email: string | null;
  items: { id: string; qty?: number }[] | null;
  photo_count: number | null;
  created_at: string | null;
  sent_at?: string | null;
};

export default async function AdminOrdersPage() {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select("id,status,total_cents,currency,email,items,photo_count,created_at,sent_at")
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as OrderRow[];

  // ✅ Collect all product ids from items
  const ids = new Set<string>();
  for (const o of orders) {
    const items = Array.isArray(o.items) ? o.items : [];
    for (const it of items) {
      if (it?.id) ids.add(it.id);
    }
  }

  // ✅ Fetch products for display
  const productIds = Array.from(ids);
  const productsMap: Record<string, { id: string; title: string; image_url: string | null }> = {};

  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id,title,image_url")
      .in("id", productIds);

    for (const p of products ?? []) {
      productsMap[p.id] = { id: p.id, title: p.title, image_url: p.image_url ?? null };
    }
  }

  return (
      <div className="pt-12 pb-24">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-black/40">
              Admin
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Commandes
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-black/60">
              Détail des photos achetées + statut d’envoi.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-10 rounded-3xl border border-black/10 bg-white p-8 text-sm text-black/60">
            Erreur Supabase : {error.message}
          </div>
        ) : (
          <div className="mt-10">
            <OrdersTable initialOrders={orders as any} productsMap={productsMap} />
          </div>
        )}
      </div>
  );
}
