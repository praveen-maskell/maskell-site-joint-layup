"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Person { id: string; full_name: string; role: string; active: boolean; }

export default function PersonnelAdminPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"laminator" | "supervisor" | "worker">("laminator");
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("authorised_personnel").select("*").order("role").order("full_name");
    setPeople((data as Person[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    await fetch("/api/admin/personnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: name.trim(), role }),
    });
    setName("");
    setBusy(false);
    load();
  }

  async function toggleActive(p: Person) {
    await fetch("/api/admin/personnel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, active: !p.active }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-paper">Authorised Personnel</h1>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
        <h2 className="text-sm font-bold text-paper/80">Add Person</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full min-h-touch rounded-lg bg-ink border-2 border-line px-3 text-paper"
        />
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setRole("laminator")} className={`min-h-touch rounded-lg border-2 font-semibold ${role === "laminator" ? "bg-accent border-accent text-ink" : "bg-ink border-line text-paper"}`}>Laminator</button>
          <button onClick={() => setRole("supervisor")} className={`min-h-touch rounded-lg border-2 font-semibold ${role === "supervisor" ? "bg-accent border-accent text-ink" : "bg-ink border-line text-paper"}`}>Supervisor</button>
          <button onClick={() => setRole("worker")} className={`min-h-touch rounded-lg border-2 font-semibold ${role === "worker" ? "bg-accent border-accent text-ink" : "bg-ink border-line text-paper"}`}>Worker</button>
        </div>
        <button disabled={busy} onClick={add} className="w-full min-h-touch rounded-lg bg-accent text-ink font-bold disabled:opacity-50">Add</button>
      </div>

      {(["laminator", "supervisor", "worker"] as const).map((r) => (
        <div key={r}>
          <h2 className="text-sm font-bold text-paper/60 uppercase mb-2">{r}s</h2>
          <div className="space-y-2">
            {people.filter((p) => p.role === r).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border-2 border-line bg-panel px-4 py-3">
                <span className={`text-paper ${!p.active ? "line-through opacity-40" : ""}`}>{p.full_name}</span>
                <button onClick={() => toggleActive(p)} className={`text-xs font-bold px-3 py-1 rounded-full ${p.active ? "bg-bad/20 text-bad" : "bg-good/20 text-good"}`}>
                  {p.active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
