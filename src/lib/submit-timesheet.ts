import { createClient } from "@/lib/supabase/client";
import { v4 as uuid } from "uuid";
import type { TimesheetState } from "@/lib/types";

// Runs from the browser with no login required, same pattern as Site Joint
// Layup submission. Only the admin area can read timesheets back.
export async function submitTimesheet(data: TimesheetState & { total_hours: number }) {
  const supabase = createClient();

  // Idempotency guard, same as site joint submissions.
  const existingRes = await fetch("/api/timesheets/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idempotencyKey: data.draftId }),
  });
  if (existingRes.ok) {
    const { timesheet } = await existingRes.json();
    if (timesheet) {
      return { timesheetRecordId: timesheet.id, submissionId: timesheet.submission_id };
    }
  }

  const timesheetRecordId = uuid();

  // Serial: JobNumber-DDMMYYYY-<name>, with a numeric suffix on collision.
  function buildSerial(attempt: number): string {
    const [y, m, d] = data.work_date.split("-");
    const namePart = data.laminator_name.replace(/[^a-z0-9]+/gi, "").slice(0, 12);
    const base = `TS-${data.job_number}-${d}${m}${y}-${namePart}`;
    return attempt === 0 ? base : `${base}-${attempt + 1}`;
  }

  let submissionId = buildSerial(0);
  let attempt = 0;
  let inserted = false;
  let lastError: any = null;

  while (!inserted && attempt < 25) {
    const { error: insErr } = await supabase.from("site_timesheets").insert({
      id: timesheetRecordId,
      submission_id: submissionId,
      idempotency_key: data.draftId,
      laminator_id: data.laminator_id || null,
      laminator_name: data.laminator_name,
      job_number: data.job_number,
      client: data.client || null,
      description: data.description,
      work_date: data.work_date,
      start_time: data.start_time,
      end_time: data.end_time,
      total_hours: data.total_hours,
    });

    if (!insErr) {
      inserted = true;
      break;
    }

    lastError = insErr;
    if ((insErr as any).code === "23505") {
      const msg = (insErr as any).message || "";
      if (msg.includes("idempotency_key")) {
        const retryRes = await fetch("/api/timesheets/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idempotencyKey: data.draftId }),
        });
        const { timesheet: retried } = await retryRes.json();
        if (retried) return { timesheetRecordId: retried.id, submissionId: retried.submission_id };
        throw insErr;
      }
      attempt++;
      submissionId = buildSerial(attempt);
      continue;
    }
    throw insErr;
  }

  if (!inserted) {
    throw lastError || new Error("Could not generate a unique timesheet ID after multiple attempts.");
  }

  // Hand off to server: send email. A failure here does NOT roll back the
  // saved record — the timesheet data is already safe.
  const res = await fetch("/api/timesheets/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timesheetRecordId }),
  });
  if (!res.ok) {
    console.error("Finalize (email) failed — record is saved, will need manual retry.");
  }

  return { timesheetRecordId, submissionId };
}
