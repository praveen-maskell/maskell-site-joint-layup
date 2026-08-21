"use client";

import { useRouter } from "next/navigation";
import { useWizardStore } from "@/store/wizard-store";
import { submitSiteJoint } from "@/lib/submit-site-joint";

export default function ReviewStep() {
  const store = useWizardStore();
  const { data, submitting, submitError, set, setSubmitting, setSubmitError, reset } = store;
  const router = useRouter();

  function validate() {
    if (data.laminator_ids.length === 0) {
      alert("Laminator is missing — go back to the Job page and select at least one.");
      return false;
    }
    if (!data.work_date) {
      alert("Confirm the work date.");
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitSiteJoint(data);
      reset();
      router.push(`/success/${result.submissionRecordId}`);
    } catch (err: any) {
      setSubmitError(err?.message || "Submission failed. Your data is saved on this device — try again when you have signal.");
    } finally {
      setSubmitting(false);
    }
  }

  const stagesCompleted = data.construction_stages.filter((s) => s.detail && s.detail.trim()).length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-paper">Review</h1>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-2 text-sm">
        <Row label="Laminator(s)" value={data.laminator_names.join(", ") || "—"} />
        <Row label="Job Number" value={data.job_number} />
        <Row label="Resin" value={data.resin_type} />
        <Row label="Materials" value={`Resin ${data.resin_weight_kg}kg · Glass ${data.glass_weight_kg}kg · Cat ${data.catalyst_percentage}`} />
        <Row label="Site" value={`${data.temperature_c || "—"}°C, ${data.weather.join(", ") || "—"}, ${data.position_of_work}`} />
        <Row label="Construction stages" value={`${stagesCompleted} / ${data.construction_stages.length} completed`} />
        <Row label="FloCoat" value={data.flocoat ? `Yes — ${data.flocoat_colour}` : "No"} />
        <Row label="Inspection" value={data.inspections.some((i) => i.result === "DEFECT") ? "Defect(s) recorded" : "All OK"} />
        <Row label="Photos" value={`${data.photos.length} / 2 attached`} />
      </div>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-2">
        <label className="block">
          <span className="block text-sm font-medium text-paper/80 mb-1">Work Date <span className="text-accent">*</span></span>
          <input
            type="date"
            value={data.work_date}
            onChange={(e) => set("work_date", e.target.value)}
            className="w-full min-h-touch rounded-xl bg-ink border-2 border-line px-4 text-lg text-paper focus:border-accent focus:outline-none"
          />
        </label>
        <p className="text-paper/40 text-xs">Defaults to today — change it if this record is for a different day.</p>
      </div>

      {submitError && (
        <p className="text-bad text-sm font-medium bg-bad/10 border border-bad rounded-lg p-3">{submitError}</p>
      )}

      <button
        type="button"
        disabled={submitting}
        onClick={handleSubmit}
        className="w-full min-h-touch rounded-xl bg-accent text-ink font-extrabold text-lg tracking-wide disabled:opacity-50"
      >
        {submitting ? "SUBMITTING..." : "SUBMIT SITE JOINT"}
      </button>

      <div className="sticky bottom-0 z-20 bg-ink/95 backdrop-blur border-t border-line px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/new/photos")}
          className="w-full min-h-touch rounded-xl border-2 border-line text-paper font-bold text-lg active:scale-[0.98]"
        >
          Back
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-paper/50">{label}</span>
      <span className="text-paper font-medium text-right">{value}</span>
    </div>
  );
}
