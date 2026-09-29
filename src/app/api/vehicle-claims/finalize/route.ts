import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createServiceSupabase } from "@/lib/supabase/server";
import { renderVehicleClaimPdf, type VehicleClaimPdfData } from "@/lib/pdf";
import { sendVehicleClaimEmail } from "@/lib/vehicle-claim-email";

async function resizedDataUri(db: ReturnType<typeof createServiceSupabase>, path: string): Promise<string> {
  const { data } = await db.storage.from("vehicle-claim-photos").createSignedUrl(path, 300);
  const signedUrl = data?.signedUrl ?? "";
  if (!signedUrl) return "";
  try {
    const res = await fetch(signedUrl);
    const arrayBuffer = await res.arrayBuffer();
    // These are meant to be shown large (the odometer digits need to be
    // legible), so resize generously — bigger than the Site Joint photos —
    // while still keeping the email attachment a sane size.
    const resized = await sharp(Buffer.from(arrayBuffer))
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 92 })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch {
    return signedUrl;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { claimRecordId, force } = await req.json();
    if (!claimRecordId) return NextResponse.json({ error: "claimRecordId required" }, { status: 400 });

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set in this deployment's environment variables." }, { status: 500 });
    }

    const db = createServiceSupabase();

    const { data: claim, error: claimErr } = await db
      .from("site_vehicle_claims")
      .select("*")
      .eq("id", claimRecordId)
      .single();

    if (claimErr) return NextResponse.json({ error: `Lookup failed: ${claimErr.message}` }, { status: 500 });
    if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    if (claim.emailed_at && !force) return NextResponse.json({ ok: true, alreadyFinalized: true });

    const [startPhotoUrl, finishPhotoUrl] = await Promise.all([
      resizedDataUri(db, claim.start_photo_path),
      resizedDataUri(db, claim.finish_photo_path),
    ]);

    const pdfData: VehicleClaimPdfData = {
      submission_id: claim.submission_id,
      laminator_name: claim.laminator_name,
      job_number: claim.job_number,
      from_location: claim.from_location,
      site_name: claim.site_name,
      work_date: claim.work_date,
      submitted_at: claim.submitted_at,
      start_photo_url: startPhotoUrl,
      finish_photo_url: finishPhotoUrl,
    };

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await renderVehicleClaimPdf(pdfData);
    } catch (e: any) {
      return NextResponse.json({ error: `PDF generation failed: ${e?.message || e}` }, { status: 500 });
    }

    const pdfPath = `${claim.submission_id}.pdf`;
    const { error: uploadErr } = await db.storage
      .from("vehicle-claim-pdfs")
      .upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true });
    if (uploadErr) return NextResponse.json({ error: `PDF upload failed: ${uploadErr.message}` }, { status: 500 });

    const { data: recipients, error: recErr } = await db
      .from("notification_settings")
      .select("email")
      .eq("active", true)
      .eq("category", "vehicle_claim");
    if (recErr) return NextResponse.json({ error: `Recipient lookup failed: ${recErr.message}` }, { status: 500 });

    const recipientEmails = (recipients ?? []).map((r: any) => r.email);
    let emailWarning: string | null = null;
    if (recipientEmails.length === 0) {
      emailWarning = "No active vehicle claim recipients configured in /admin/recipients — PDF was generated but no email was sent.";
    } else {
      try {
        await sendVehicleClaimEmail(pdfData, recipientEmails, pdfBuffer);
      } catch (e: any) {
        emailWarning = `Email send failed: ${e?.message || e}`;
      }
    }

    await db
      .from("site_vehicle_claims")
      .update({ pdf_storage_path: pdfPath, emailed_at: new Date().toISOString() })
      .eq("id", claimRecordId);

    return NextResponse.json({ ok: true, pdfPath, warning: emailWarning });
  } catch (e: any) {
    return NextResponse.json({ error: `Unexpected error: ${e?.message || e}` }, { status: 500 });
  }
}
