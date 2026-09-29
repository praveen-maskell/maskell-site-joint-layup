"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useVehicleClaimStore } from "@/store/vehicle-claim-store";
import { usePersonnel } from "@/lib/use-personnel";
import { TextField } from "@/components/ui/TextField";
import { PhotoCapture } from "@/components/ui/PhotoCapture";
import { submitVehicleClaim } from "@/lib/submit-vehicle-claim";

export default function VehicleClaimPage() {
  const {
    data, set, selectLaminator, setStartPhoto, setFinishPhoto,
    submitting, submitError, setSubmitting, setSubmitError, reset,
  } = useVehicleClaimStore();
  const { laminators, loading } = usePersonnel();
  const router = useRouter();
  const [localError, setLocalError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  function validate(): string | null {
    if (!data.laminator_id) return "Select who this claim is for.";
    if (!/^\d{4,5}$/.test(data.job_number.trim())) return "Job Number must be 4 or 5 digits.";
    if (!data.from_location.trim()) return "Enter where the trip started from.";
    if (!data.site_name.trim()) return "Enter the site name.";
    if (!data.work_date) return "Select the work date.";
    if (data.work_date > todayStr) return "Work Date can't be in the future.";
    if (!data.start_photo) return "Take a photo of the start odometer reading.";
    if (!data.finish_photo) return "Take a photo of the finish odometer reading.";
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitVehicleClaim(data);
      reset();
      router.push(`/success/vehicle/${result.claimRecordId}`);
    } catch (e: any) {
      setSubmitError(e?.message || "Submission failed. Your data is saved on this device — try again when you have signal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-paper">Personal Vehicle Usage Claim</h1>

      <div>
        <span className="block text-sm font-medium text-paper/80 mb-2">
          Submitted By <span className="text-accent">*</span>
        </span>
        {loading ? (
          <p className="text-paper/40 text-sm">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {laminators.map((p) => {
              const selected = data.laminator_id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectLaminator(p.id, p.full_name)}
                  className={`min-h-touch rounded-xl px-3 py-3 text-base font-semibold border-2 active:scale-[0.98] ${
                    selected ? "bg-accent border-accent text-ink" : "bg-panel border-line text-paper"
                  }`}
                >
                  {p.full_name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <TextField
        label="Job Number" required
        value={data.job_number}
        onChange={(v) => set("job_number", v.replace(/\D/g, "").slice(0, 5))}
        placeholder="e.g. 1055"
      />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="From" required
          value={data.from_location}
          onChange={(v) => set("from_location", v)}
          placeholder="e.g. Auckland"
        />
        <TextField
          label="Site Name" required
          value={data.site_name}
          onChange={(v) => set("site_name", v)}
          placeholder="e.g. Watercare Site"
        />
      </div>

      <label className="block">
        <span className="block text-sm font-medium text-paper/80 mb-1">Work Date <span className="text-accent">*</span></span>
        <input
          type="date"
          value={data.work_date}
          max={todayStr}
          onChange={(e) => set("work_date", e.target.value)}
          className="w-full min-h-touch rounded-xl bg-panel border-2 border-line px-4 text-lg text-paper focus:border-accent focus:outline-none"
        />
      </label>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
        <h2 className="text-sm font-bold text-paper/80 uppercase tracking-wide">Start</h2>
        <PhotoCapture
          photoType="Start KM Odometer Photo"
          existing={data.start_photo ?? undefined}
          onCapture={setStartPhoto}
          onRemove={() => setStartPhoto(null)}
          stampTimestamp
        />
      </div>

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-3">
        <h2 className="text-sm font-bold text-paper/80 uppercase tracking-wide">Finish</h2>
        <PhotoCapture
          photoType="Finish KM Odometer Photo"
          existing={data.finish_photo ?? undefined}
          onCapture={setFinishPhoto}
          onRemove={() => setFinishPhoto(null)}
          stampTimestamp
        />
      </div>

      {(localError || submitError) && (
        <p className="text-bad text-sm font-medium bg-bad/10 border border-bad rounded-lg p-3">
          {localError || submitError}
        </p>
      )}

      <div className="sticky bottom-0 z-20 bg-ink/95 backdrop-blur border-t border-line -mx-4 px-4 py-3">
        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="w-full min-h-touch rounded-xl bg-accent text-ink font-extrabold text-lg tracking-wide disabled:opacity-50"
        >
          {submitting ? "SUBMITTING..." : "SUBMIT CLAIM"}
        </button>
      </div>
    </div>
  );
}
