import { createClient } from "@/lib/supabase/client";
import { v4 as uuid } from "uuid";
import type { WizardState } from "@/lib/types";

// Runs from the browser with no login required — anyone with the link can
// submit (by design). Only the admin area can read submissions back. Hands
// off to a server route (using the service role) for PDF generation + email
// once the record is saved.
export async function submitSiteJoint(data: WizardState) {
  const supabase = createClient();
  const submittedByName = data.laminator_names.join(", ");

  // Idempotency guard: if this draftId was already submitted (e.g. a retry
  // after a network drop), return the existing record instead of duplicating.
  // Submissions aren't browsable by anon, so this goes through a narrow
  // server lookup keyed on the exact (unguessable) draft UUID.
  const existingRes = await fetch("/api/submissions/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idempotencyKey: data.draftId }),
  });
  if (existingRes.ok) {
    const { submission } = await existingRes.json();
    if (submission) {
      return { submissionRecordId: submission.id, submissionId: submission.submission_id };
    }
  }

  // Ensure job row exists (upsert)
  await supabase
    .from("jobs")
    .upsert({ job_number: data.job_number }, { onConflict: "job_number" });
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("job_number", data.job_number)
    .single();

  const { data: idRes, error: idErr } = await supabase.rpc("next_submission_id");
  if (idErr) throw idErr;
  const submissionId: string = idRes;

  // Generate the row's primary key ourselves rather than asking Postgres to
  // hand it back via RETURNING — RETURNING requires the SELECT policy to
  // also pass, and SELECT on this table is admin-only by design (so no one
  // can browse other people's submissions). Insert-only avoids that entirely.
  const submissionRecordId = uuid();

  const { error: subErr } = await supabase
    .from("site_joint_submissions")
    .insert({
      id: submissionRecordId,
      submission_id: submissionId,
      idempotency_key: data.draftId,
      job_id: job?.id,
      job_number: data.job_number,
      resin_type: data.resin_type || null,
      laminate_details: data.job_details || null,
      temperature_c: data.temperature_c || null,
      weather: data.weather,
      position_of_work: data.position_of_work,
      flocoat: data.flocoat,
      flocoat_colour: data.flocoat_colour || null,
      flocoat_weight_kg: data.flocoat_weight_kg ? Number(data.flocoat_weight_kg) : null,
      laminator_ids: data.laminator_ids,
      laminator_names: data.laminator_names,
      submitted_by_name: submittedByName,
      work_date: data.work_date || null,
    });
  if (subErr) {
    // Unique violation on idempotency_key means a concurrent/duplicate retry
    // beat us to it — look it up rather than surfacing an error.
    if ((subErr as any).code === "23505") {
      const retryRes = await fetch("/api/submissions/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: data.draftId }),
      });
      const { submission: retried } = await retryRes.json();
      if (retried) return { submissionRecordId: retried.id, submissionId: retried.submission_id };
    }
    throw subErr;
  }

  await supabase.from("site_joint_materials").insert({
    submission_id: submissionRecordId,
    resin_weight_kg: Number(data.resin_weight_kg),
    glass_weight_kg: Number(data.glass_weight_kg),
    catalyst_percentage: parseFloat(data.catalyst_percentage),
    resin_batch_no: data.resin_batch_no,
    glass_batch_no: data.glass_batch_no,
  });

  // Layup: joint prep, tack, dynamic construction stages, and finish —
  // only rows with a real detail selected are saved. No per-step time is
  // collected; the single work_date on the submission covers that.
  const stepsToSave: {
    step_no: number; step_label: string; detail: string | null; width_mm: number | null; position: string | null;
  }[] = [];
  let stepNo = 1;

  if (data.joint_prep_detail.trim()) {
    stepsToSave.push({ step_no: stepNo++, step_label: "Check Joint Preparation", detail: data.joint_prep_detail, width_mm: null, position: null });
  }
  if (data.tack_detail.trim()) {
    stepsToSave.push({
      step_no: stepNo++, step_label: "Construction Details - Tack", detail: data.tack_detail,
      width_mm: null, position: null,
    });
  }
  data.construction_stages.forEach((s, idx) => {
    if (s.position === "Both") {
      if (s.internal_detail && s.internal_detail.trim()) {
        stepsToSave.push({
          step_no: stepNo++, step_label: `Construction Details - Stage ${idx + 1} (Internal)`, detail: s.internal_detail,
          width_mm: null, position: "Internal",
        });
      }
      if (s.external_detail && s.external_detail.trim()) {
        stepsToSave.push({
          step_no: stepNo++, step_label: `Construction Details - Stage ${idx + 1} (External)`, detail: s.external_detail,
          width_mm: null, position: "External",
        });
      }
    } else if (s.detail && s.detail.trim()) {
      stepsToSave.push({
        step_no: stepNo++, step_label: `Construction Details - Stage ${idx + 1}`, detail: s.detail,
        width_mm: null, position: s.position || null,
      });
    }
  });
  if (data.finish_detail.trim()) {
    stepsToSave.push({
      step_no: stepNo++, step_label: "Finish - External", detail: data.finish_detail,
      width_mm: data.finish_width_mm ? Number(data.finish_width_mm) : null, position: null,
    });
  }

  if (stepsToSave.length) {
    await supabase.from("site_joint_layup_steps").insert(
      stepsToSave.map((s) => ({ submission_id: submissionRecordId, ...s }))
    );
  }

  await supabase.from("site_joint_inspections").insert(
    data.inspections.map((i) => ({
      submission_id: submissionRecordId,
      item: i.item,
      result: i.result,
      details: i.details,
    }))
  );

  // Photos: upload to storage, then record rows
  for (const photo of data.photos) {
    const path = `${data.job_number}/${submissionId}/${photo.photo_type.replace(/[^a-z0-9]+/gi, "-")}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("site-joint-photos")
      .upload(path, photo.file, { contentType: photo.file.type, upsert: false });
    if (upErr) throw new Error(`Photo upload failed (${photo.photo_type}): ${upErr.message}`);

    await supabase.from("site_joint_photos").insert({
      submission_id: submissionRecordId,
      job_number: data.job_number,
      photo_type: photo.photo_type,
      storage_path: path,
      uploaded_by_name: submittedByName,
    });
  }

  // Hand off to server: generate PDF + send email. Fire-and-await, but a
  // failure here does NOT roll back the saved record — QA data is already
  // safe; the record can be re-emailed/re-PDF'd from the admin area.
  const res = await fetch("/api/submissions/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionRecordId }),
  });
  if (!res.ok) {
    console.error("Finalize (PDF/email) failed — record is saved, will need manual retry.");
  }

  return { submissionRecordId, submissionId };
}
