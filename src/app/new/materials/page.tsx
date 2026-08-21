"use client";

import { useWizardStore } from "@/store/wizard-store";
import { NumericField } from "@/components/ui/NumericField";
import { TextField } from "@/components/ui/TextField";
import { WizardNav } from "@/components/wizard/WizardNav";

export default function MaterialsStep() {
  const { data, set } = useWizardStore();

  function validate() {
    const { resin_weight_kg, glass_weight_kg, catalyst_percentage, resin_batch_no } = data;
    if (!resin_weight_kg || !glass_weight_kg || !catalyst_percentage) {
      alert("Resin weight, Glass weight, and Catalyst % are all required.");
      return false;
    }
    if (!resin_batch_no.trim()) {
      alert("Resin Batch No. is required.");
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-paper">Material Used</h1>
      <p className="text-paper/60 text-sm">Actual material consumed for this joint.</p>

      <NumericField label="Resin Weight" required unit="kg" value={data.resin_weight_kg} onChange={(v) => set("resin_weight_kg", v)} placeholder="12.5" />
      <TextField label="Resin Batch No." required value={data.resin_batch_no} onChange={(v) => set("resin_batch_no", v)} />

      <NumericField label="Glass Weight" required unit="kg" value={data.glass_weight_kg} onChange={(v) => set("glass_weight_kg", v)} placeholder="8.2" />
      <TextField label="Glass Batch No." value={data.glass_batch_no} onChange={(v) => set("glass_batch_no", v)} />

      <NumericField label="Catalyst" required unit="%" value={data.catalyst_percentage} onChange={(v) => set("catalyst_percentage", v)} placeholder="2" />

      <WizardNav backHref="/new" nextHref="/new/site" onBeforeNext={validate} />
    </div>
  );
}
