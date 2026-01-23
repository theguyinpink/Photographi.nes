"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabasePublic } from "@/lib/supabase-public";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!r.ok) {
      const data = await r.json().catch(() => null);
      alert(data?.message ?? "Connexion impossible");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        className="w-full rounded-xl border px-4 py-3"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="w-full rounded-xl border px-4 py-3"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        disabled={loading}
        className="w-full rounded-xl bg-black py-3 text-white"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
