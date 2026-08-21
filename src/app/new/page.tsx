"use client";

import { useWizardStore } from "@/store/wizard-store";
import { usePersonnel } from "@/lib/use-personnel";
import { TextField } from "@/components/ui/TextField";
import { WizardNav } from "@/components/wizard/WizardNav";

export default function JobStep() {
  const { data, set, toggleLaminator } = useWizardStore();
  const { laminators, loading } = usePersonnel();

  function validate() {
    if (data.laminator_ids.length === 0) {
      alert("Select at least one Laminator.");
      return false;
    }
    if (!/^\d{4,5}$/.test(data.job_number.trim())) {
      alert("Job Number must be 4 or 5 digits.");
      return false;
    }
    if (!data.job_details.trim()) {
      alert("Job Details is required.");
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-paper">Job</h1>

      <div>
        <span className="block text-sm font-medium text-paper/80 mb-2">
          Laminator <span className="text-accent">*</span>
          <span className="text-paper/40 font-normal"> — tap all that apply</span>
        </span>
        {loading ? (
          <p className="text-paper/40 text-sm">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {laminators.map((p) => {
              const selected = data.laminator_ids.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleLaminator(p.id, p.full_name)}
                  className={`min-h-touch rounded-xl px-3 py-3 text-base font-semibold border-2 active:scale-[0.98] ${
                    selected ? "bg-accent border-accent text-ink" : "bg-panel border-line text-paper"
                  }`}
                >
                  {p.full_name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <TextField
        label="Job Number" required
        value={data.job_number}
        onChange={(v) => set("job_number", v.replace(/\D/g, "").slice(0, 5))}
        placeholder="e.g. 1055"
      />

      <TextField label="Job Details" required value={data.job_details} onChange={(v) => set("job_details", v)} placeholder="Describe the job" />

      <WizardNav nextHref="/new/site" onBeforeNext={validate} />
    </div>
  );
}
