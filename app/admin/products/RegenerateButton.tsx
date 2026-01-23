"use client";

import { useState } from "react";

export default function RegenerateButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMsg(null);
    const r = await fetch("/api/admin/products/regenerate?limit=50", {
      method: "POST",
    });
    const j = await r.json().catch(() => null);
    setLoading(false);
    setMsg(r.ok ? `OK — updated: ${j.updated}, skipped: ${j.skipped}` : "Erreur");
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={loading}
        className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm shadow-sm hover:bg-black hover:text-white transition"
      >
        {loading ? "Regénération..." : "Regénérer les aperçus protégés"}
      </button>
      {msg ? <span className="text-sm text-black/60">{msg}</span> : null}
    </div>
  );
}
