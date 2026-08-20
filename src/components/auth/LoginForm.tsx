"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError("Login failed. Check your email and password, or contact your admin.");
      return;
    }
    router.push(params.get("next") || "/new");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-paper/80 mb-1">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full min-h-touch rounded-xl bg-panel border-2 border-line px-4 text-lg text-paper focus:border-accent focus:outline-none"
          autoComplete="username"
        />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-paper/80 mb-1">Password</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full min-h-touch rounded-xl bg-panel border-2 border-line px-4 text-lg text-paper focus:border-accent focus:outline-none"
          autoComplete="current-password"
        />
      </label>

      {error && <p className="text-bad text-sm font-medium">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full min-h-touch rounded-xl bg-accent text-ink font-bold text-lg disabled:opacity-50"
      >
        {busy ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
