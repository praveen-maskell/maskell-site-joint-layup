import { Resend } from "resend";
import type { SubmissionPdfData } from "@/lib/pdf";

export async function sendSiteJointEmail(d: SubmissionPdfData, recipients: string[], pdfBuffer: Buffer) {
  if (!recipients.length) return;
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — skipping email send.");
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const inspectionResult = d.inspections.some((i) => i.result === "DEFECT") ? "DEFECT(S) RECORDED" : "ALL OK";

  const html = `
    <div style="font-family: Arial, sans-serif; color:#111; max-width:600px;">
      <h2 style="margin-bottom:4px;">Site Joint Completed</h2>
      <p style="color:#555;margin-top:0;">${d.submission_id} · ${new Date(d.submitted_at).toLocaleString("en-NZ")}</p>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        ${row("Job Number", d.job_number)}
        ${row("DWG No.", d.dwg_no)}
        ${row("Joint ID", d.joint_id)}
        ${row("DN", d.dn ?? "—")}
        ${row("PN", d.pn ?? "—")}
        ${row("Resin", d.resin_type ?? "—")}
        ${row("Resin Weight", `${d.materials.resin_weight_kg} kg`)}
        ${row("Glass Weight", `${d.materials.glass_weight_kg} kg`)}
        ${row("Catalyst Weight", `${d.materials.catalyst_weight_kg} kg`)}
        ${row("Laminator", d.laminator_name)}
        ${row("Supervisor", d.supervisor_name)}
        ${row("Site Conditions", `${d.temperature_c ?? "—"}°C, ${d.weather.join(", ") || "—"}, ${d.position_of_work}`)}
        ${row("Inspection Result", inspectionResult)}
      </table>
      <p style="margin-top:16px;color:#555;font-size:12px;">Full QA record attached as PDF. Photos are stored in Supabase and viewable via the admin portal.</p>
    </div>
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: recipients,
    subject: `SITE JOINT COMPLETED — JOB ${d.job_number} — JOINT ${d.joint_id}`,
    html,
    attachments: [
      {
        filename: `${d.submission_id}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ],
  });
}

function row(label: string, value: string) {
  return `<tr><td style="padding:4px 8px;color:#666;border-bottom:1px solid #eee;">${label}</td><td style="padding:4px 8px;font-weight:600;border-bottom:1px solid #eee;">${value}</td></tr>`;
}
