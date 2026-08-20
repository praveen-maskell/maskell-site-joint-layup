"use client";

import { useWizardStore } from "@/store/wizard-store";
import { OkDefectToggle } from "@/components/ui/OkDefectToggle";
import { TextField } from "@/components/ui/TextField";
import { WizardNav } from "@/components/wizard/WizardNav";

export default function InspectionStep() {
  const { data, updateInspection } = useWizardStore();

  function validate() {
    const missingDetails = data.inspections.find((i) => i.result === "DEFECT" && !i.details?.trim());
    if (missingDetails) {
      alert(`Add details for the defect found: ${missingDetails.item}.`);
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-paper">Visual Inspection</h1>

      {data.inspections.map((insp) => (
        <div key={insp.item} className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
          <span className="font-semibold text-paper">{insp.item}</span>
          <OkDefectToggle value={insp.result} onChange={(v) => updateInspection(insp.item, { result: v, details: v === "OK" ? null : insp.details })} />
          {insp.result === "DEFECT" && (
            <TextField
              label="Defect details"
              required
              value={insp.details ?? ""}
              onChange={(v) => updateInspection(insp.item, { details: v })}
              placeholder="Describe the defect"
            />
          )}
        </div>
      ))}

      <WizardNav backHref="/new/layup" nextHref="/new/photos" onBeforeNext={validate} />
    </div>
  );
}
