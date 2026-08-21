"use client";

import { useWizardStore } from "@/store/wizard-store";
import { usePersonnel } from "@/lib/use-personnel";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { WizardNav } from "@/components/wizard/WizardNav";

export default function JobStep() {
  const { data, set } = useWizardStore();
  const { laminators, loading } = usePersonnel();

  function validate() {
    if (!data.laminator_id) {
      alert("Select your name.");
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

      <SelectField
        label="Your Name" required
        value={data.laminator_id}
        onChange={(v) => {
          const person = laminators.find((p) => p.id === v);
          set("laminator_id", v);
          set("submitted_by_personnel_id", v);
          set("submitted_by_name", person?.full_name ?? "");
        }}
        options={laminators.map((p) => ({ value: p.id, label: p.full_name }))}
        placeholder={loading ? "Loading..." : "Who's submitting this?"}
      />

      <TextField
        label="Job Number" required
        value={data.job_number}
        onChange={(v) => set("job_number", v.replace(/\D/g, "").slice(0, 5))}
        placeholder="e.g. 1055"
      />

      <TextField label="Job Details" required value={data.job_details} onChange={(v) => set("job_details", v)} placeholder="Describe the job" />

      <WizardNav nextHref="/new/materials" onBeforeNext={validate} />
    </div>
  );
}
