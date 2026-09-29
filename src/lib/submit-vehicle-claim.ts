import { createClient } from "@/lib/supabase/client";
import { v4 as uuid } from "uuid";
import type { VehicleClaimState } from "@/lib/types";

// Same pattern as Site Joint Layup / Timesheet: no login required, client
// generates its own row id and a collision-safe serial number rather than
// relying on INSERT ... RETURNING (which would require a passing SELECT
// policy that anon submissions can never satisfy).
export async function submitVehicleClaim(data: VehicleClaimState) {
  const supabase = createClient();

  const existingRes = await fetch("/api/vehicle-claims/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idempotencyKey: data.draftId }),
  });
  if (existingRes.ok) {
    const { claim } = await existingRes.json();
    if (claim) {
      return { claimRecordId: claim.id, submissionId: claim.submission_id };
    }
  }

  if (!data.start_photo || !data.finish_photo) {
    throw new Error("Both odometer photos are required.");
  }

  const claimRecordId = uuid();

  function buildSerial(attempt: number): string {
    const [y, m, d] = data.work_date.split("-");
    const namePart = data.laminator_name.replace(/[^a-z0-9]+/gi, "").slice(0, 12);
    const base = `VC-${d}${m}${y}-${namePart}`;
    return attempt === 0 ? base : `${base}-${attempt + 1}`;
  }

  // Upload photos first, keyed by the (already unique) claim record id, so
  // no serial-collision retry can ever produce a duplicate storage path.
  const startPath = `${claimRecordId}/start-${Date.now()}.jpg`;
  const { error: startUpErr } = await supabase.storage
    .from("vehicle-claim-photos")
    .upload(startPath, data.start_photo.file, { contentType: data.start_photo.file.type, upsert: false });
  if (startUpErr) throw new Error(`Start photo upload failed: ${startUpErr.message}`);

  const finishPath = `${claimRecordId}/finish-${Date.now()}.jpg`;
  const { error: finishUpErr } = await supabase.storage
    .from("vehicle-claim-photos")
    .upload(finishPath, data.finish_photo.file, { contentType: data.finish_photo.file.type, upsert: false });
  if (finishUpErr) throw new Error(`Finish photo upload failed: ${finishUpErr.message}`);

  let submissionId = buildSerial(0);
  let attempt = 0;
  let inserted = false;
  let lastError: any = null;

  while (!inserted && attempt < 25) {
    const { error: insErr } = await supabase.from("site_vehicle_claims").insert({
      id: claimRecordId,
      submission_id: submissionId,
      idempotency_key: data.draftId,
      laminator_id: data.laminator_id || null,
      laminator_name: data.laminator_name,
      job_number: data.job_number,
      from_location: data.from_location,
      site_name: data.site_name,
      work_date: data.work_date,
      start_photo_path: startPath,
      finish_photo_path: finishPath,
    });

    if (!insErr) {
      inserted = true;
      break;
    }

    lastError = insErr;
    if ((insErr as any).code === "23505") {
      const msg = (insErr as any).message || "";
      if (msg.includes("idempotency_key")) {
        const retryRes = await fetch("/api/vehicle-claims/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idempotencyKey: data.draftId }),
        });
        const { claim: retried } = await retryRes.json();
        if (retried) return { claimRecordId: retried.id, submissionId: retried.submission_id };
        throw insErr;
      }
      attempt++;
      submissionId = buildSerial(attempt);
      continue;
    }
    throw insErr;
  }

  if (!inserted) {
    throw lastError || new Error("Could not generate a unique claim ID after multiple attempts.");
  }

  const res = await fetch("/api/vehicle-claims/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ claimRecordId }),
  });
  if (!res.ok) {
    console.error("Finalize (PDF/email) failed — record is saved, will need manual retry.");
  }

  return { claimRecordId, submissionId };
}
