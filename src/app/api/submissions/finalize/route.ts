import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { renderSiteJointPdf, type SubmissionPdfData } from "@/lib/pdf";
import { sendSiteJointEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { submissionRecordId } = await req.json();
  if (!submissionRecordId) return NextResponse.json({ error: "submissionRecordId required" }, { status: 400 });

  // Verify caller is authenticated and owns (or administers) this submission
  const userSupabase = createServerSupabase();
  const { data: userRes } = await userSupabase.auth.getUser();
  if (!userRes.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Service client for the cross-table reads/writes this job needs
  const db = createServiceSupabase();

  const { data: sub, error: subErr } = await db
    .from("site_joint_submissions")
    .select(
      `*, materials:site_joint_materials(*), layup_steps:site_joint_layup_steps(*),
       inspections:site_joint_inspections(*), photos:site_joint_photos(*),
       laminator:authorised_personnel!site_joint_submissions_laminator_id_fkey(full_name),
       supervisor:authorised_personnel!site_joint_submissions_supervisor_id_fkey(full_name),
       submitter:profiles!site_joint_submissions_submitted_by_fkey(full_name)`
    )
    .eq("id", submissionRecordId)
    .single();

  if (subErr || !sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (sub.submitted_by !== userRes.user.id) {
    // only the submitter (or a future admin re-trigger) may finalize
    const { data: profile } = await db.from("profiles").select("role").eq("id", userRes.user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    dwg_no: sub.dwg_no,
    dn: sub.dn,
    pn: sub.pn,
    joint_id: sub.joint_id,
    resin_type: sub.resin_type,
    laminate_details: sub.laminate_details,
    batch_no: sub.batch_no,
    temperature_c: sub.temperature_c,
    weather: sub.weather ?? [],
    position_of_work: sub.position_of_work,
    flocoat: sub.flocoat,
    flocoat_colour: sub.flocoat_colour,
    wax_coat_details: sub.wax_coat_details,
    submitted_at: sub.submitted_at,
    laminator_name: sub.laminator?.full_name ?? "—",
    supervisor_name: sub.supervisor?.full_name ?? "—",
    submitted_by_name: sub.submitter?.full_name ?? "—",
    materials: sub.materials ?? { resin_weight_kg: 0, glass_weight_kg: 0, catalyst_weight_kg: 0, resin_batch_no: null, glass_batch_no: null, catalyst_batch_no: null },
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
