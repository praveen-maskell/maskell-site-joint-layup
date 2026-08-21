"use client";

import { useRouter } from "next/navigation";
import { useWizardStore } from "@/store/wizard-store";
import { submitSiteJoint } from "@/lib/submit-site-joint";

export default function ReviewStep() {
  const store = useWizardStore();
  const { data, submitting, submitError, setSubmitting, setSubmitError, reset } = store;
  const router = useRouter();

  function validate() {
    if (!data.laminator_id) {
      alert("Your name is missing — go back to the Job page and select it.");
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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-paper">Review</h1>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-2 text-sm">
        <Row label="Submitted By" value={data.submitted_by_name} />
        <Row label="Job Number" value={data.job_number} />
        <Row label="Resin" value={data.resin_type} />
        <Row label="Materials" value={`Resin ${data.resin_weight_kg}kg · Glass ${data.glass_weight_kg}kg · Cat ${data.catalyst_percentage}%`} />
        <Row label="Site" value={`${data.temperature_c || "—"}°C, ${data.weather.join(", ") || "—"}, ${data.position_of_work}`} />
        <Row label="Layup steps" value={`${data.layup_steps.filter((s) => s.detail && s.detail !== "N/A").length} completed`} />
        <Row label="FloCoat" value={data.flocoat ? `Yes — ${data.flocoat_colour}` : "No"} />
        <Row label="Inspection" value={data.inspections.some((i) => i.result === "DEFECT") ? "Defect(s) recorded" : "All OK"} />
        <Row label="Photos" value={`${data.photos.length} / 2 attached`} />
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
