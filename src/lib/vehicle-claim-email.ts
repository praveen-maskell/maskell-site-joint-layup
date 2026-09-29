import { Resend } from "resend";
import type { VehicleClaimPdfData } from "@/lib/pdf";

export async function sendVehicleClaimEmail(d: VehicleClaimPdfData, recipients: string[], pdfBuffer: Buffer) {
  if (!recipients.length) return;
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — skipping vehicle claim email send.");
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = `
    <div style="font-family: Arial, sans-serif; color:#111; max-width:600px;">
      <h2 style="margin-bottom:4px;">Personal Vehicle Usage Claim</h2>
      <p style="color:#555;margin-top:0;">${d.submission_id} · ${new Date(d.submitted_at).toLocaleString("en-NZ")}</p>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        ${row("Submitted By", d.laminator_name)}
        ${row("Job Number", d.job_number)}
        ${row("From", d.from_location)}
        ${row("Work Date", d.work_date)}
      </table>
      <p style="margin-top:16px;color:#555;font-size:12px;">Odometer photos attached as PDF.</p>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: recipients,
    subject: `Personal Vehicle Usage Claim — JOB ${d.job_number} — ${d.laminator_name} — ${d.work_date}`,
    html,
    attachments: [
      {
        filename: `${d.submission_id}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ],
  });

  if (error) {
    throw new Error(`Resend rejected the email: ${error.message || JSON.stringify(error)}`);
  }
  return data;
}

function row(label: string, value: string) {
  return `<tr><td style="padding:4px 8px;color:#666;border-bottom:1px solid #eee;">${label}</td><td style="padding:4px 8px;font-weight:600;border-bottom:1px solid #eee;">${value}</td></tr>`;
}
