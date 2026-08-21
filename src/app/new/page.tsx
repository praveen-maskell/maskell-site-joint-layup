"use client";

import { useWizardStore } from "@/store/wizard-store";
import { TextField } from "@/components/ui/TextField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { WizardNav } from "@/components/wizard/WizardNav";
import { RESIN_TYPES } from "@/lib/constants";

export default function JobStep() {
  const { data, set } = useWizardStore();

  function validate() {
    if (!/^\d{4,5}$/.test(data.job_number.trim())) {
      alert("Job Number must be 4 or 5 digits.");
      return false;
    }
    if (!data.resin_type) {
      alert("Select a Resin type.");
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

      <TextField
        label="Job Number" required
        value={data.job_number}
        onChange={(v) => set("job_number", v.replace(/\D/g, "").slice(0, 5))}
        placeholder="e.g. 1055"
      />

      <div>
        <span className="block text-sm font-medium text-paper/80 mb-2">Resin <span className="text-accent">*</span></span>
        <SegmentedControl options={RESIN_TYPES} value={data.resin_type} columns={2} onChange={(v) => set("resin_type", v)} />
      </div>

      <TextField label="Job Details" required value={data.job_details} onChange={(v) => set("job_details", v)} placeholder="Describe the job" />

      <WizardNav nextHref="/new/materials" onBeforeNext={validate} />
    </div>
  );
}
