"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Recipient { id: string; email: string; category: string; active: boolean; }

export default function RecipientsAdminPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<"qa" | "production" | "other">("qa");
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("notification_settings").select("*").order("category").order("email");
    setRecipients((data as Recipient[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!email.trim()) return;
    setBusy(true);
    await fetch("/api/admin/recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), category }),
    });
    setEmail("");
    setBusy(false);
    load();
  }

  async function toggleActive(r: Recipient) {
    await fetch("/api/admin/recipients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, active: !r.active }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-paper">Email Notification Recipients</h1>
      <p className="text-paper/50 text-sm">Every completed Site Joint record is emailed to all active recipients below.</p>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
        <h2 className="text-sm font-bold text-paper/80">Add Recipient</h2>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@maskell.co.nz"
          type="email"
          className="w-full min-h-touch rounded-lg bg-ink border-2 border-line px-3 text-paper"
        />
        <div className="grid grid-cols-3 gap-2">
          {(["qa", "production", "other"] as const).map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`min-h-touch rounded-lg border-2 font-semibold capitalize ${category === c ? "bg-accent border-accent text-ink" : "bg-ink border-line text-paper"}`}>
              {c}
            </button>
          ))}
        </div>
        <button disabled={busy} onClick={add} className="w-full min-h-touch rounded-lg bg-accent text-ink font-bold disabled:opacity-50">Add</button>
      </div>

      {(["qa", "production", "other"] as const).map((c) => (
        <div key={c}>
          <h2 className="text-sm font-bold text-paper/60 uppercase mb-2">{c}</h2>
          <div className="space-y-2">
            {recipients.filter((r) => r.category === c).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border-2 border-line bg-panel px-4 py-3">
                <span className={`text-paper ${!r.active ? "line-through opacity-40" : ""}`}>{r.email}</span>
                <button onClick={() => toggleActive(r)} className={`text-xs font-bold px-3 py-1 rounded-full ${r.active ? "bg-bad/20 text-bad" : "bg-good/20 text-good"}`}>
                  {r.active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            ))}
            {recipients.filter((r) => r.category === c).length === 0 && (
              <p className="text-paper/30 text-xs">No recipients yet.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
