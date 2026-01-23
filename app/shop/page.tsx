// app/shop/page.tsx
import Link from "next/link";
import { supabasePublic } from "@/lib/supabase-public";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Product = {
  id: string;
  title: string;
  price_cents: number;
  currency: string | null;
  image_url: string | null;
};

export default async function ShopPage() {
  const { data, error } = await supabasePublic
    .from("products")
    .select("id, title, price_cents, currency, image_url")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Erreur Supabase</h1>
        <pre>{error.message}</pre>
      </div>
    );
  }

  const products = (data ?? []) as Product[];

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: 600 }}>Boutique</h1>
      <p style={{ marginTop: 8, color: "#555" }}>
        Clique sur une photo pour ouvrir la fiche produit.
      </p>

      <div style={{ marginTop: 20 }}>
        <Link href="/cart">→ Ouvrir le panier</Link>
      </div>

      {products.length === 0 ? (
        <p style={{ marginTop: 40 }}>Aucun produit disponible.</p>
      ) : (
        <div
          style={{
            marginTop: 40,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 24,
          }}
        >
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              style={{
                display: "block",
                border: "1px solid #ddd",
                borderRadius: 16,
                padding: 12,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {p.image_url ? (
                // volontairement <img>, PAS next/image pour éviter les 400
                <img
                  src={p.image_url}
                  alt={p.title}
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "contain",
                    borderRadius: 12,
                    background: "#f5f5f5",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 180,
                    borderRadius: 12,
                    background: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#888",
                  }}
                >
                  Pas d’image
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600 }}>{p.title}</div>
                <div style={{ marginTop: 4, color: "#555" }}>
                  {(p.price_cents / 100).toFixed(2)} {p.currency ?? "EUR"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
