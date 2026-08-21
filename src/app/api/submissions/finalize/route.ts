import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { renderSiteJointPdf, type SubmissionPdfData } from "@/lib/pdf";
import { sendSiteJointEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { submissionRecordId } = await req.json();
  if (!submissionRecordId) return NextResponse.json({ error: "submissionRecordId required" }, { status: 400 });

  // No login is required to submit a Site Joint record, so there's no user
  // session to check here — this route is only ever called right after a
  // fresh insert with that record's own id, and it's idempotent (see the
  // emailed_at guard below), so it's safe to run purely off the service role.
  const db = createServiceSupabase();

  const { data: sub, error: subErr } = await db
    .from("site_joint_submissions")
    .select(
      `*, materials:site_joint_materials(*), layup_steps:site_joint_layup_steps(*),
       inspections:site_joint_inspections(*), photos:site_joint_photos(*)`
    )
    .eq("id", submissionRecordId)
    .single();

  if (subErr || !sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (sub.emailed_at) return NextResponse.json({ ok: true, alreadyFinalized: true });

  // signed URLs for photos so the PDF renderer can fetch them
  const photosWithUrls = await Promise.all(
    (sub.photos ?? []).map(async (p: any) => {
      const { data } = await db.storage.from("site-joint-photos").createSignedUrl(p.storage_path, 300);
      return { photo_type: p.photo_type, signedUrl: data?.signedUrl ?? "" };
    })
  );

  const pdfData: SubmissionPdfData = {
    submission_id: sub.submission_id,
    job_number: sub.job_number,
    resin_type: sub.resin_type,
    job_details: sub.laminate_details,
    temperature_c: sub.temperature_c,
    weather: sub.weather ?? [],
    position_of_work: sub.position_of_work,
    flocoat: sub.flocoat,
    flocoat_colour: sub.flocoat_colour,
    flocoat_weight_kg: sub.flocoat_weight_kg,
    wax_coat_details: sub.wax_coat_details,
    submitted_at: sub.submitted_at,
    work_date: sub.work_date,
    laminator_names: sub.laminator_names ?? [],
    materials: sub.materials ?? { resin_weight_kg: 0, glass_weight_kg: 0, catalyst_percentage: null, resin_batch_no: null, glass_batch_no: null },
    layup_steps: (sub.layup_steps ?? []).sort((a: any, b: any) => a.step_no - b.step_no),
    inspections: sub.inspections ?? [],
    photos: photosWithUrls,
  };

  const pdfBuffer = await renderSiteJointPdf(pdfData);
  const pdfPath = `${sub.job_number}/${sub.submission_id}.pdf`;
  await db.storage.from("site-joint-pdfs").upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true });

  const { data: recipients } = await db
    .from("notification_settings")
    .select("email")
    .eq("active", true)
    .in("category", ["qa", "production", "other"]);

  await sendSiteJointEmail(pdfData, (recipients ?? []).map((r: any) => r.email), pdfBuffer);

  await db
    .from("site_joint_submissions")
    .update({ pdf_storage_path: pdfPath, emailed_at: new Date().toISOString() })
    .eq("id", submissionRecordId);

  return NextResponse.json({ ok: true, pdfPath });
}
