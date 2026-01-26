// app/success/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Order = {
  id: string;
  status: string | null;
  total_cents: number | null;
  currency: string | null;
  created_at: string | null;
  photo_count: number | null;
  email: string | null;
};

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 🔒 server only
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  const orderId = order_id;

  if (!orderId) redirect("/shop");

  // ✅ admin client : bypass RLS
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select("id,status,total_cents,currency,created_at,photo_count,email")
    .eq("id", orderId)
    .maybeSingle();

  const order = data as Order | null;

  localStorage.removeItem("checkout_id");

  return (
    <Shell>
      <main className="pt-12 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-xs uppercase tracking-[0.22em] text-black/40">
            Checkout
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Paiement confirmé ✅
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-black/60">
            Merci ! Ton paiement a bien été pris en compte.
          </p>
          <div className="mt-6 rounded-2xl border border-black/10 bg-black/2 p-4">
            <div className="text-sm font-semibold text-black/80">
              📩 Email de livraison
            </div>
            <p className="mt-2 text-sm text-black/65 leading-relaxed">
              Nous allons vous envoyer un email avec vos liens de
              téléchargement dans les 24/48h. Si vous ne le voyez pas dans votre boite reception,
              pensez à vérifier vos{" "}
              <strong>spams / courriers indésirables</strong> (Gmail, Outlook…).
              <br />
              Vous pouvez aussi ajouter notre adresse à vos contacts pour être
              sûr de recevoir les prochains emails.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-[28px] border border-black/10 bg-white">
            <div className="p-6 sm:p-8">
              {error || !order ? (
                <div className="text-sm text-black/60">
                  <div className="font-medium text-black/80">
                    Commande introuvable
                  </div>

                  <div className="mt-2">
                    order_id :{" "}
                    <span className="font-mono text-xs text-black/50">
                      {orderId}
                    </span>
                  </div>

                  {/* ✅ debug soft (tu peux enlever après) */}
                  {error ? (
                    <pre className="mt-4 overflow-auto rounded-2xl border border-black/10 bg-black/2 p-4 text-xs text-black/60">
                      {JSON.stringify(error, null, 2)}
                    </pre>
                  ) : null}

                  <div className="mt-4">
                    <Link
                      href="/shop"
                      className="underline underline-offset-8 text-sm font-medium"
                    >
                      Retour boutique
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <div className="text-sm text-black/50">
                      Numéro de commande
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-black/2 px-4 py-3 font-mono text-xs text-black/70">
                      {order.id}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-black/40">
                        Statut
                      </div>
                      <div className="mt-2 text-sm font-semibold text-black/80">
                        {order.status ?? "—"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-black/40">
                        Photos
                      </div>
                      <div className="mt-2 text-sm font-semibold text-black/80">
                        {order.photo_count ?? "—"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-black/40">
                        Total
                      </div>
                      <div className="mt-2 text-sm font-semibold text-black/80">
                        {order.total_cents != null
                          ? `${(order.total_cents / 100).toFixed(2)} ${
                              order.currency?.toUpperCase() ?? "EUR"
                            }`
                          : "—"}
                      </div>
                    </div>
                  </div>

                  {order.email ? (
                    <div className="text-sm text-black/55">
                      Reçu envoyé à :{" "}
                      <span className="font-medium text-black/75">
                        {order.email}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/shop"
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black/80 transition hover:bg-black/3 sm:w-auto"
                    >
                      Continuer la boutique
                    </Link>
                    <Link
                      href="/cart"
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/90 sm:w-auto"
                    >
                      Voir le panier
                    </Link>
                  </div>

                  <div className="text-xs text-black/40">
                    Prochaine étape : livraison des photos HD après confirmation
                    webhook.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </Shell>
  );
}
