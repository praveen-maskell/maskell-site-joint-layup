import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { renderSiteJointPdf, type SubmissionPdfData } from "@/lib/pdf";
import { sendSiteJointEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { submissionRecordId, force } = await req.json();
    if (!submissionRecordId) return NextResponse.json({ error: "submissionRecordId required" }, { status: 400 });

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set in this deployment's environment variables." }, { status: 500 });
    }

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

    if (subErr) return NextResponse.json({ error: `Lookup failed: ${subErr.message}` }, { status: 500 });
    if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    if (sub.emailed_at && !force) return NextResponse.json({ ok: true, alreadyFinalized: true });

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
      submitted_at: sub.submitted_at,
      work_date: sub.work_date,
      laminator_names: sub.laminator_names ?? [],
      materials: sub.materials ?? { resin_weight_kg: 0, glass_weight_kg: 0, catalyst_percentage: null, resin_batch_no: null, glass_batch_no: null },
      layup_steps: (sub.layup_steps ?? []).sort((a: any, b: any) => a.step_no - b.step_no),
      inspections: sub.inspections ?? [],
      photos: photosWithUrls,
    };

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await renderSiteJointPdf(pdfData);
    } catch (e: any) {
      return NextResponse.json({ error: `PDF generation failed: ${e?.message || e}` }, { status: 500 });
    }

    const pdfPath = `${sub.job_number}/${sub.submission_id}.pdf`;
    const { error: uploadErr } = await db.storage
      .from("site-joint-pdfs")
      .upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true });
    if (uploadErr) return NextResponse.json({ error: `PDF upload failed: ${uploadErr.message}` }, { status: 500 });

    const { data: recipients, error: recErr } = await db
      .from("notification_settings")
      .select("email")
      .eq("active", true)
      .in("category", ["qa", "production", "other"]);
    if (recErr) return NextResponse.json({ error: `Recipient lookup failed: ${recErr.message}` }, { status: 500 });

    const recipientEmails = (recipients ?? []).map((r: any) => r.email);
    let emailWarning: string | null = null;
    if (recipientEmails.length === 0) {
      emailWarning = "No active recipients configured in /admin/recipients — PDF was generated but no email was sent.";
    } else {
      try {
        await sendSiteJointEmail(pdfData, recipientEmails, pdfBuffer);
      } catch (e: any) {
        emailWarning = `Email send failed: ${e?.message || e}`;
      }
    }

    await db
      .from("site_joint_submissions")
      .update({ pdf_storage_path: pdfPath, emailed_at: new Date().toISOString() })
      .eq("id", submissionRecordId);

    return NextResponse.json({ ok: true, pdfPath, warning: emailWarning });
  } catch (e: any) {
    return NextResponse.json({ error: `Unexpected error: ${e?.message || e}` }, { status: 500 });
  }
}
