"use client";

import { useState } from "react";
import { attachImagesToProduct } from "@/lib/storage";

export default function UploadImages({ productId }: { productId: string }) {
  const [thumb, setThumb] = useState<File | null>(null);
  const [flip, setFlip] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!thumb || !flip) {
      alert("Ajoute le thumbnail et le flipagram");
      return;
    }

    setLoading(true);
    try {
      await attachImagesToProduct(productId, thumb, flip);
      alert("Images liées au produit ✅");
    } catch (e: any) {
      alert(e.message ?? "Erreur upload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-black/10 bg-white p-6">
      <div>
        <label className="block text-sm text-black/60 mb-1">
          Thumbnail (aperçu)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumb(e.target.files?.[0] ?? null)}
        />
      </div>

      <div>
        <label className="block text-sm text-black/60 mb-1">
          Flipagram (aperçu protégé)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFlip(e.target.files?.[0] ?? null)}
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Upload..." : "Uploader & lier"}
      </button>
    </div>
  );
}
