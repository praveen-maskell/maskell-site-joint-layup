"use client";

import { useState } from "react";
import { useWizardStore } from "@/store/wizard-store";
import { NumericField } from "@/components/ui/NumericField";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { WizardNav } from "@/components/wizard/WizardNav";
import { LAYUP_DETAIL_OPTIONS, FLOCOAT_COLOURS, MANDATORY_LAYUP_STEP_LABEL } from "@/lib/constants";

const OTHER = "Other";

export default function LayupStep() {
  const { data, updateLayupStep, addExtraLayupStep, set } = useWizardStore();
  const [otherText, setOtherText] = useState<Record<number, string>>({});

  function validate() {
    const mandatory = data.layup_steps.find((s) => s.step_label === MANDATORY_LAYUP_STEP_LABEL);
    if (!mandatory?.detail?.trim()) {
      alert(`"${MANDATORY_LAYUP_STEP_LABEL}" is required.`);
      return false;
    }
    if (data.flocoat && !data.flocoat_colour) {
      alert("Select a FloCoat colour.");
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-paper">Layup</h1>

      {data.layup_steps.map((step) => {
        const predefined = LAYUP_DETAIL_OPTIONS[step.step_label] ?? [];
        const isMandatory = step.step_label === MANDATORY_LAYUP_STEP_LABEL;
        const isJointPrep = step.step_no === 1;
        const isOther = step.detail === OTHER || (!!step.detail && !predefined.includes(step.detail) && step.detail !== "N/A");
        return (
          <div key={step.step_no} className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-paper">
                {step.step_no}. {step.step_label} {isMandatory && <span className="text-accent">*</span>}
              </span>
              {step.completed_at && <span className="text-good text-xs">✓ {new Date(step.completed_at).toLocaleTimeString()}</span>}
            </div>

            {predefined.length > 0 ? (
              <div>
                <span className="block text-sm font-medium text-paper/80 mb-2">Detail / Layup</span>
                <SegmentedControl
                  options={[...predefined, OTHER]}
                  value={isOther ? OTHER : step.detail ?? ""}
                  onChange={(v) => updateLayupStep(step.step_no, { detail: v === OTHER ? (otherText[step.step_no] || "") : v })}
                />
              </div>
            ) : null}

            {(isOther || predefined.length === 0) && (
              <TextField
                label="Detail (free text)"
                value={otherText[step.step_no] ?? step.detail ?? ""}
                onChange={(v) => {
                  setOtherText((s) => ({ ...s, [step.step_no]: v }));
                  updateLayupStep(step.step_no, { detail: v });
                }}
                placeholder="Describe layup detail"
              />
            )}

            {!isJointPrep && (
              <NumericField label="Width" unit="mm" value={step.width_mm?.toString() ?? ""} onChange={(v) => updateLayupStep(step.step_no, { width_mm: v ? Number(v) : null })} />
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addExtraLayupStep}
        className="w-full min-h-touch rounded-xl border-2 border-dashed border-line text-paper/60 font-semibold"
      >
        + Add Step
      </button>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
        <span className="font-semibold text-paper">FloCoat</span>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => set("flocoat", true)} className={`min-h-touch rounded-xl border-2 font-bold ${data.flocoat ? "bg-accent border-accent text-ink" : "bg-ink border-line text-paper"}`}>Yes</button>
          <button type="button" onClick={() => set("flocoat", false)} className={`min-h-touch rounded-xl border-2 font-bold ${!data.flocoat ? "bg-accent border-accent text-ink" : "bg-ink border-line text-paper"}`}>No</button>
        </div>
        {data.flocoat && (
          <>
            <SelectField label="Colour" required value={data.flocoat_colour} onChange={(v) => set("flocoat_colour", v)} options={FLOCOAT_COLOURS.map((c) => ({ value: c, label: c }))} />
            <TextField label="Wax Coat Details" value={data.wax_coat_details} onChange={(v) => set("wax_coat_details", v)} placeholder="If required" />
          </>
        )}
      </div>

      <WizardNav backHref="/new/site" nextHref="/new/inspection" onBeforeNext={validate} />
    </div>
  );
}
