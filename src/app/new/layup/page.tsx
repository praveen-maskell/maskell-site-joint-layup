"use client";

import { useState } from "react";
import { useWizardStore } from "@/store/wizard-store";
import { NumericField } from "@/components/ui/NumericField";
import { TextField } from "@/components/ui/TextField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { WizardNav } from "@/components/wizard/WizardNav";
import {
  JOINT_PREP_OPTIONS, TACK_DETAIL_OPTIONS, CONSTRUCTION_LAYUP_OPTIONS, FINISH_DETAIL_OPTIONS,
  CONSTRUCTION_POSITIONS, MAX_CONSTRUCTION_STAGES, FLOCOAT_COLOURS,
} from "@/lib/constants";

// Small reusable "pick from predefined options, or type your own" control.
// Fixed: tapping the fallback button now reliably switches into free-text
// mode even while the typed value is still empty — previously the mode was
// derived only from the current value, so an empty "Other" tap looked like
// nothing happened.
function DetailPicker({
  label, value, predefined, onChange, includeOther = true, otherButtonLabel = "Other", otherLabel = "Detail (free text)",
}: {
  label: string;
  value: string;
  predefined: string[];
  onChange: (v: string) => void;
  includeOther?: boolean;
  otherButtonLabel?: string;
  otherLabel?: string;
}) {
  const [otherMode, setOtherMode] = useState(() => includeOther && !!value && !predefined.includes(value));
  const [otherText, setOtherText] = useState(() => (otherMode ? value : ""));

  const displayValue = otherMode ? otherButtonLabel : value;

  function handleSelect(v: string) {
    if (v === otherButtonLabel) {
      setOtherMode(true);
      onChange(otherText);
    } else {
      setOtherMode(false);
      onChange(v);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-paper/80">{label}</span>
      <SegmentedControl
        options={includeOther ? [...predefined, otherButtonLabel] : predefined}
        value={displayValue}
        onChange={handleSelect}
      />
      {otherMode && (
        <TextField
          label={otherLabel}
          required
          value={otherText}
          onChange={(v) => {
            setOtherText(v);
            onChange(v);
          }}
          placeholder="Describe"
        />
      )}
    </div>
  );
}

export default function LayupStep() {
  const { data, set, updateConstructionStage, addConstructionStage } = useWizardStore();
  const [flocoatOtherMode, setFlocoatOtherMode] = useState(
    () => !!data.flocoat_colour && !FLOCOAT_COLOURS.includes(data.flocoat_colour)
  );
  const [flocoatOtherText, setFlocoatOtherText] = useState(() => (flocoatOtherMode ? data.flocoat_colour : ""));

  function validate() {
    const stage1 = data.construction_stages[0];
    if (!stage1?.position || !stage1?.detail?.trim()) {
      alert("Construction Details — Stage 1 needs a Position and Layup selected.");
      return false;
    }
    if (data.tack_detail.trim() && !data.tack_width_mm) {
      alert("Enter the Tack Width — required once a Tack layup is selected.");
      return false;
    }
    const finishIsOther = data.finish_detail && !FINISH_DETAIL_OPTIONS.includes(data.finish_detail);
    if (finishIsOther && !data.finish_detail.trim()) {
      alert("Enter comments for the Finish detail.");
      return false;
    }
    if (data.flocoat && !data.flocoat_colour) {
      alert("Select a FloCoat colour.");
      return false;
    }
    if (data.flocoat && !data.flocoat_weight_kg) {
      alert("Enter the FloCoat weight (kg).");
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-paper">Layup</h1>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
        <span className="font-semibold text-paper">Check Joint Preparation</span>
        <DetailPicker label="Detail" value={data.joint_prep_detail} predefined={JOINT_PREP_OPTIONS} includeOther={false} onChange={(v) => set("joint_prep_detail", v)} />
      </div>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
        <span className="font-semibold text-paper">Construction Details - Tack</span>
        <DetailPicker label="Layup" value={data.tack_detail} predefined={TACK_DETAIL_OPTIONS} onChange={(v) => set("tack_detail", v)} />
        <NumericField
          label="Width" unit="mm" required={!!data.tack_detail.trim()}
          value={data.tack_width_mm} onChange={(v) => set("tack_width_mm", v)}
        />
      </div>

      <div className="space-y-3">
        <span className="font-semibold text-paper">
          Construction Details <span className="text-paper/40 font-normal text-sm">(Stage 1 required)</span>
        </span>
        {data.construction_stages.map((stage) => (
          <div key={stage.stage_no} className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
            <div>
              <span className="block text-sm font-medium text-paper/80 mb-2">Position</span>
              <SegmentedControl
                options={CONSTRUCTION_POSITIONS}
                value={stage.position}
                onChange={(v) => updateConstructionStage(stage.stage_no, { position: v, detail: v === "Both" ? null : stage.detail })}
              />
            </div>
            {stage.position === "Both" ? (
              <p className="text-paper/50 text-sm bg-ink rounded-lg p-3">
                A single Layup can't be assigned when Position is "Both" — choose Internal or External to record a Layup for this stage.
              </p>
            ) : (
              <DetailPicker
                label="Layup"
                value={stage.detail ?? ""}
                predefined={CONSTRUCTION_LAYUP_OPTIONS}
                otherLabel="Stage Number"
                onChange={(v) => updateConstructionStage(stage.stage_no, { detail: v })}
              />
            )}
          </div>
        ))}

        {data.construction_stages.length < MAX_CONSTRUCTION_STAGES && (
          <button
            type="button"
            onClick={addConstructionStage}
            className="w-full min-h-touch rounded-xl border-2 border-dashed border-line text-paper/60 font-semibold"
          >
            + Add More Construction Details ({data.construction_stages.length} / {MAX_CONSTRUCTION_STAGES})
          </button>
        )}
      </div>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
        <span className="font-semibold text-paper">Finish - External</span>
        <DetailPicker label="Detail" value={data.finish_detail} predefined={FINISH_DETAIL_OPTIONS} otherLabel="Comments" onChange={(v) => set("finish_detail", v)} />
        <NumericField label="Width" unit="mm" value={data.finish_width_mm} onChange={(v) => set("finish_width_mm", v)} />
      </div>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
        <span className="font-semibold text-paper">FloCoat</span>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => set("flocoat", true)} className={`min-h-touch rounded-xl border-2 font-bold ${data.flocoat ? "bg-accent border-accent text-ink" : "bg-ink border-line text-paper"}`}>Yes</button>
          <button type="button" onClick={() => set("flocoat", false)} className={`min-h-touch rounded-xl border-2 font-bold ${!data.flocoat ? "bg-accent border-accent text-ink" : "bg-ink border-line text-paper"}`}>No</button>
        </div>
        {data.flocoat && (
          <>
            <div className="space-y-2">
              <span className="block text-sm font-medium text-paper/80">Colour <span className="text-accent">*</span></span>
              <SegmentedControl
                options={[...FLOCOAT_COLOURS, "Custom"]}
                value={flocoatOtherMode ? "Custom" : data.flocoat_colour}
                onChange={(v) => {
                  if (v === "Custom") {
                    setFlocoatOtherMode(true);
                    set("flocoat_colour", flocoatOtherText);
                  } else {
                    setFlocoatOtherMode(false);
                    set("flocoat_colour", v);
                  }
                }}
              />
              {flocoatOtherMode && (
                <TextField
                  label="Enter colour" required
                  value={flocoatOtherText}
                  onChange={(v) => {
                    setFlocoatOtherText(v);
                    set("flocoat_colour", v);
                  }}
                  placeholder="Describe the colour"
                />
              )}
            </div>
            <NumericField label="Weight" required unit="kg" value={data.flocoat_weight_kg} onChange={(v) => set("flocoat_weight_kg", v)} placeholder="e.g. 1.5" />
          </>
        )}
      </div>

      <WizardNav backHref="/new/materials" nextHref="/new/inspection" onBeforeNext={validate} />
    </div>
  );
}
