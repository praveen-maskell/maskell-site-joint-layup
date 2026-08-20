"use client";

import { useWizardStore } from "@/store/wizard-store";
import { NumericField } from "@/components/ui/NumericField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { WizardNav } from "@/components/wizard/WizardNav";
import { WEATHER_OPTIONS, POSITION_OF_WORK_OPTIONS } from "@/lib/constants";

export default function SiteStep() {
  const { data, set } = useWizardStore();

  function validate() {
    if (!data.position_of_work) {
      alert("Select the position of work.");
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-paper">Site Conditions</h1>

      <NumericField label="Temperature" unit="°C" value={data.temperature_c} onChange={(v) => set("temperature_c", v)} placeholder="e.g. 18" />

      <div>
        <span className="block text-sm font-medium text-paper/80 mb-2">Weather (select all that apply)</span>
        <SegmentedControl options={WEATHER_OPTIONS} value={data.weather} multi columns={3} onChange={(v) => set("weather", v)} />
      </div>

      <div>
        <span className="block text-sm font-medium text-paper/80 mb-2">Position of Work <span className="text-accent">*</span></span>
        <SegmentedControl options={POSITION_OF_WORK_OPTIONS} value={data.position_of_work} onChange={(v) => set("position_of_work", v)} />
      </div>

      <p className="text-paper/40 text-xs">Date and time are recorded automatically on submission.</p>

      <WizardNav backHref="/new/materials" nextHref="/new/layup" onBeforeNext={validate} />
    </div>
  );
}
