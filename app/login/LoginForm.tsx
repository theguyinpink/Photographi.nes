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

    const { error } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-black/60">Email</label>
        <input
          className="w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-black/30"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ines@email.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-black/60">Mot de passe</label>
        <input
          type="password"
          className="w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-black/30"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
