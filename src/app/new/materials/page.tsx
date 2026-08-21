"use client";

import { useWizardStore } from "@/store/wizard-store";
import { NumericField } from "@/components/ui/NumericField";
import { TextField } from "@/components/ui/TextField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { WizardNav } from "@/components/wizard/WizardNav";
import { RESIN_TYPES, CATALYST_PERCENTAGE_OPTIONS } from "@/lib/constants";

export default function MaterialsStep() {
  const { data, set } = useWizardStore();

  function validate() {
    if (!data.resin_type) {
      alert("Select a Resin type.");
      return false;
    }
    const { resin_weight_kg, glass_weight_kg, catalyst_percentage, resin_batch_no } = data;
    if (!resin_weight_kg || !glass_weight_kg || !catalyst_percentage) {
      alert("Resin weight, Glass weight, and Catalyst % are all required.");
      return false;
    }
    if (!resin_batch_no.trim()) {
      alert("Resin Batch No. is required.");
      return false;
    }
    if (!data.glass_batch_no.trim()) {
      alert("Glass Batch No. is required.");
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-paper">Material Used</h1>
      <p className="text-paper/60 text-sm">Actual material consumed for this joint.</p>

      <div>
        <span className="block text-sm font-medium text-paper/80 mb-2">Resin <span className="text-accent">*</span></span>
        <SegmentedControl options={RESIN_TYPES} value={data.resin_type} columns={2} onChange={(v) => set("resin_type", v)} />
      </div>

      <NumericField label="Resin Weight" required unit="kg" value={data.resin_weight_kg} onChange={(v) => set("resin_weight_kg", v)} placeholder="12.5" />
      <TextField label="Resin Batch No." required value={data.resin_batch_no} onChange={(v) => set("resin_batch_no", v)} />

      <NumericField label="Glass Weight" required unit="kg" value={data.glass_weight_kg} onChange={(v) => set("glass_weight_kg", v)} placeholder="8.2" />
      <TextField label="Glass Batch No." required value={data.glass_batch_no} onChange={(v) => set("glass_batch_no", v)} />

      <div>
        <span className="block text-sm font-medium text-paper/80 mb-2">Catalyst <span className="text-accent">*</span></span>
        <SegmentedControl options={CATALYST_PERCENTAGE_OPTIONS} value={data.catalyst_percentage} columns={3} onChange={(v) => set("catalyst_percentage", v)} />
      </div>

      <WizardNav backHref="/new/site" nextHref="/new/layup" onBeforeNext={validate} />
    </div>
  );
}
