"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTimesheetStore } from "@/store/timesheet-store";
import { usePersonnel } from "@/lib/use-personnel";
import { TextField } from "@/components/ui/TextField";
import { TimePicker } from "@/components/ui/TimePicker";
import { submitTimesheet } from "@/lib/submit-timesheet";

function hoursBetween(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) return null;
  return Math.round((minutes / 60) * 100) / 100;
}

export default function TimesheetPage() {
  const { data, set, selectLaminator, submitting, submitError, setSubmitting, setSubmitError, reset } =
    useTimesheetStore();
  const { laminators, loading } = usePersonnel();
  const router = useRouter();
  const [localError, setLocalError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const totalHours = hoursBetween(data.start_time, data.end_time);

  function validate(): string | null {
    if (!data.laminator_id) return "Select who this time sheet is for.";
    if (!/^[A-Za-z0-9]{2,5}$/.test(data.job_number.trim())) return "Job Number must be 2 to 5 characters (letters and/or digits).";
    if (!data.description.trim()) return "Describe the work done.";
    if (!data.work_date) return "Select the work date.";
    if (data.work_date > todayStr) return "Work Date can't be in the future.";
    if (!data.start_time || !data.end_time) return "Enter both a start and end time.";
    if (totalHours === null) return "End time must be after start time.";
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
      const result = await submitTimesheet({ ...data, total_hours: totalHours } as any);
      reset();
      router.push(`/success/timesheet/${result.timesheetRecordId}`);
    } catch (e: any) {
      setSubmitError(e?.message || "Submission failed. Your data is saved on this device — try again when you have signal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-paper">Time Sheet</h1>

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
        onChange={(v) => set("job_number", v.replace(/[^A-Za-z0-9]/g, "").slice(0, 5).toUpperCase())}
        placeholder="e.g. 1055"
      />

      <div className="grid grid-cols-2 gap-3">
        <TextField label="Client" value={data.client} onChange={(v) => set("client", v)} placeholder="e.g. Watercare" />
        <TextField label="Site Location" value={data.site_location} onChange={(v) => set("site_location", v)} placeholder="e.g. 12 Wharf Rd" />
      </div>

      <TextField
        label="Description of Work" required
        value={data.description}
        onChange={(v) => set("description", v)}
        placeholder="What was done today"
      />

      <div className="rounded-xl border-2 border-line bg-panel p-4 space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-paper/80 mb-1">Work Date <span className="text-accent">*</span></span>
          <input
            type="date"
            value={data.work_date}
            max={todayStr}
            onChange={(e) => set("work_date", e.target.value)}
            className="w-full min-h-touch rounded-xl bg-ink border-2 border-line px-4 text-lg text-paper focus:border-accent focus:outline-none"
          />
        </label>
        <p className="text-paper/40 text-xs -mt-2">Defaults to today — change it if this is for a different day.</p>

        <div className="grid grid-cols-2 gap-3">
          <TimePicker label="Start Time" required value={data.start_time} onChange={(v) => set("start_time", v)} />
          <TimePicker label="End Time" required value={data.end_time} onChange={(v) => set("end_time", v)} />
        </div>

        {totalHours !== null && (
          <p className="text-paper/70 text-sm">
            Total: <span className="text-accent font-semibold">{totalHours} hours</span>
          </p>
        )}
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
          {submitting ? "SUBMITTING..." : "SUBMIT TIME SHEET"}
        </button>
      </div>
    </div>
  );
}
