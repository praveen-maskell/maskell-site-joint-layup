import { createClient } from "@/lib/supabase/client";
import type { WizardState } from "@/lib/types";

// Runs from the browser with no login required — anyone with the link can
// submit (by design, per the "just names, no sign-in" requirement). Only the
// admin area can read submissions back. Hands off to a server route (using
// the service role) for PDF generation + email once the record is saved.
export async function submitSiteJoint(data: WizardState) {
  const supabase = createClient();

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
    .upsert({ job_number: data.job_number, dwg_no: data.dwg_no }, { onConflict: "job_number" });
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("job_number", data.job_number)
    .single();

  const { data: idRes, error: idErr } = await supabase.rpc("next_submission_id");
  if (idErr) throw idErr;
  const submissionId: string = idRes;

  const { data: submission, error: subErr } = await supabase
    .from("site_joint_submissions")
    .insert({
      submission_id: submissionId,
      idempotency_key: data.draftId,
      job_id: job?.id,
      job_number: data.job_number,
      dwg_no: data.dwg_no,
      dn: data.dn || null,
      pn: data.pn || null,
      joint_id: data.joint_id,
      resin_type: data.resin_type || null,
      laminate_details: data.laminate_details || null,
      batch_no: data.batch_no || null,
      temperature_c: data.temperature_c ? Number(data.temperature_c) : null,
      weather: data.weather,
      position_of_work: data.position_of_work,
      flocoat: data.flocoat,
      flocoat_colour: data.flocoat_colour || null,
      wax_coat_details: data.wax_coat_details || null,
      laminator_id: data.laminator_id,
      supervisor_id: data.supervisor_id,
      submitted_by_personnel_id: data.submitted_by_personnel_id,
      submitted_by_name: data.submitted_by_name,
    })
    .select("id")
    .single();
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
  const submissionRecordId: string = submission.id;

  await supabase.from("site_joint_materials").insert({
    submission_id: submissionRecordId,
    resin_weight_kg: Number(data.resin_weight_kg),
    glass_weight_kg: Number(data.glass_weight_kg),
    catalyst_weight_kg: Number(data.catalyst_weight_kg),
    resin_batch_no: data.resin_batch_no || null,
    glass_batch_no: data.glass_batch_no || null,
    catalyst_batch_no: data.catalyst_batch_no || null,
  });

  const stepsToSave = data.layup_steps.filter((s) => s.initials.trim());
  if (stepsToSave.length) {
    await supabase.from("site_joint_layup_steps").insert(
      stepsToSave.map((s) => ({
        submission_id: submissionRecordId,
        step_no: s.step_no,
        step_label: s.step_label,
        detail: s.detail,
        width_mm: s.width_mm,
        initials: s.initials,
        completed_at: s.completed_at || new Date().toISOString(),
      }))
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
    const path = `${data.job_number}/${data.joint_id}/${submissionId}/${photo.photo_type.replace(/[^a-z0-9]+/gi, "-")}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("site-joint-photos")
      .upload(path, photo.file, { contentType: photo.file.type, upsert: false });
    if (upErr) throw new Error(`Photo upload failed (${photo.photo_type}): ${upErr.message}`);

    await supabase.from("site_joint_photos").insert({
      submission_id: submissionRecordId,
      job_number: data.job_number,
      joint_id: data.joint_id,
      photo_type: photo.photo_type,
      storage_path: path,
      uploaded_by_name: data.submitted_by_name,
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
