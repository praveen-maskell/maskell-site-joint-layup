"use client";

import { useState } from "react";
import { useWizardStore } from "@/store/wizard-store";
import { NumericField } from "@/components/ui/NumericField";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { WizardNav } from "@/components/wizard/WizardNav";
import {
  JOINT_PREP_OPTIONS, TACK_DETAIL_OPTIONS, CONSTRUCTION_LAYUP_OPTIONS, FINISH_DETAIL_OPTIONS,
  CONSTRUCTION_POSITIONS, MAX_CONSTRUCTION_STAGES, FLOCOAT_COLOURS,
} from "@/lib/constants";

const OTHER = "Other";

// Small reusable "pick from predefined options, or type your own" control —
// mirrors the pattern used across the layup section.
function DetailPicker({
  label, value, predefined, onChange,
}: {
  label: string;
  value: string;
  predefined: string[];
  onChange: (v: string) => void;
}) {
  const [otherText, setOtherText] = useState("");
  const isOther = !!value && !predefined.includes(value);

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-paper/80">{label}</span>
      <SegmentedControl
        options={[...predefined, OTHER]}
        value={isOther ? OTHER : value}
        onChange={(v) => onChange(v === OTHER ? otherText : v)}
      />
      {isOther && (
        <TextField
          label="Detail (free text)"
          value={otherText || value}
          onChange={(v) => {
            setOtherText(v);
            onChange(v);
          }}
          placeholder="Describe layup detail"
        />
      )}
    </div>
  );
}

export default function LayupStep() {
  const { data, set, updateConstructionStage, addConstructionStage } = useWizardStore();

  function validate() {
    const stage1 = data.construction_stages[0];
    if (!stage1?.position || !stage1?.detail?.trim()) {
      alert("Construction Details — Stage 1 needs a Position and Layup selected.");
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
        <DetailPicker label="Detail" value={data.joint_prep_detail} predefined={JOINT_PREP_OPTIONS} onChange={(v) => set("joint_prep_detail", v)} />
      </div>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
        <span className="font-semibold text-paper">Construction Details - Tack</span>
        <DetailPicker label="Layup" value={data.tack_detail} predefined={TACK_DETAIL_OPTIONS} onChange={(v) => set("tack_detail", v)} />
        <NumericField label="Width" unit="mm" value={data.tack_width_mm} onChange={(v) => set("tack_width_mm", v)} />
      </div>

      <div className="space-y-3">
        <span className="font-semibold text-paper">Construction Details</span>
        {data.construction_stages.map((stage, idx) => (
          <div key={stage.stage_no} className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
            <span className="font-semibold text-paper/80">
              Stage {stage.stage_no} {idx === 0 && <span className="text-accent">*</span>}
            </span>
            <div>
              <span className="block text-sm font-medium text-paper/80 mb-2">Position</span>
              <SegmentedControl
                options={CONSTRUCTION_POSITIONS}
                value={stage.position}
                onChange={(v) => updateConstructionStage(stage.stage_no, { position: v })}
              />
            </div>
            <DetailPicker
              label="Layup"
              value={stage.detail ?? ""}
              predefined={CONSTRUCTION_LAYUP_OPTIONS}
              onChange={(v) => updateConstructionStage(stage.stage_no, { detail: v })}
            />
            <NumericField
              label="Width" unit="mm"
              value={stage.width_mm}
              onChange={(v) => updateConstructionStage(stage.stage_no, { width_mm: v })}
            />
          </div>
        ))}

        {data.construction_stages.length < MAX_CONSTRUCTION_STAGES && (
          <button
            type="button"
            onClick={addConstructionStage}
            className="w-full min-h-touch rounded-xl border-2 border-dashed border-line text-paper/60 font-semibold"
          >
            + Add Stage ({data.construction_stages.length} / {MAX_CONSTRUCTION_STAGES})
          </button>
        )}
      </div>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
        <span className="font-semibold text-paper">Finish - External</span>
        <DetailPicker label="Detail" value={data.finish_detail} predefined={FINISH_DETAIL_OPTIONS} onChange={(v) => set("finish_detail", v)} />
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
            <SelectField label="Colour" required value={data.flocoat_colour} onChange={(v) => set("flocoat_colour", v)} options={FLOCOAT_COLOURS.map((c) => ({ value: c, label: c }))} />
            <NumericField label="FloCoat Weight" required unit="kg" value={data.flocoat_weight_kg} onChange={(v) => set("flocoat_weight_kg", v)} placeholder="e.g. 1.5" />
            <TextField label="Wax Coat Details" value={data.wax_coat_details} onChange={(v) => set("wax_coat_details", v)} placeholder="If required" />
          </>
        )}
      </div>

      <WizardNav backHref="/new/materials" nextHref="/new/inspection" onBeforeNext={validate} />
    </div>
  );
}
