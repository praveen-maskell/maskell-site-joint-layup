"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Person { id: string; full_name: string; role: string; active: boolean; }

// Personnel is intentionally just "laminators" now — admin access is handled
// separately via Supabase Auth login, so this list doesn't need a role picker.
export default function PersonnelAdminPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("authorised_personnel").select("*").order("full_name");
    setPeople((data as Person[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    await fetch("/api/admin/personnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: name.trim(), role: "laminator" }),
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

  function startEdit(p: Person) {
    setEditingId(p.id);
    setEditName(p.full_name);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    setBusy(true);
    await fetch("/api/admin/personnel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, full_name: editName.trim() }),
    });
    setBusy(false);
    setEditingId(null);
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-paper">Laminators</h1>
      <p className="text-paper/50 text-sm">Anyone in this list can select their name when submitting a Site Joint record.</p>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
        <h2 className="text-sm font-bold text-paper/80">Add Laminator</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full min-h-touch rounded-lg bg-ink border-2 border-line px-3 text-paper"
        />
        <button disabled={busy} onClick={add} className="w-full min-h-touch rounded-lg bg-accent text-ink font-bold disabled:opacity-50">Add</button>
      </div>

      <div className="space-y-2">
        {people.map((p) =>
          editingId === p.id ? (
            <div key={p.id} className="rounded-lg border-2 border-accent bg-panel p-3 space-y-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full min-h-touch rounded-lg bg-ink border-2 border-line px-3 text-paper"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setEditingId(null)} className="min-h-touch rounded-lg border-2 border-line text-paper font-semibold">Cancel</button>
                <button disabled={busy} onClick={() => saveEdit(p.id)} className="min-h-touch rounded-lg bg-accent text-ink font-bold disabled:opacity-50">Save</button>
              </div>
            </div>
          ) : (
            <div key={p.id} className="flex items-center justify-between rounded-lg border-2 border-line bg-panel px-4 py-3 gap-2">
              <button onClick={() => startEdit(p)} className={`text-left flex-1 text-paper ${!p.active ? "line-through opacity-40" : ""}`}>
                {p.full_name}
              </button>
              <button onClick={() => startEdit(p)} className="text-xs font-bold px-3 py-1 rounded-full bg-line text-paper/70">
                Edit
              </button>
              <button onClick={() => toggleActive(p)} className={`text-xs font-bold px-3 py-1 rounded-full ${p.active ? "bg-bad/20 text-bad" : "bg-good/20 text-good"}`}>
                {p.active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          )
        )}
        {people.length === 0 && <p className="text-paper/30 text-xs">No laminators added yet.</p>}
      </div>
    </div>
  );
}
