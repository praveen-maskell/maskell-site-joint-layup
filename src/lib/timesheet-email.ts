import { Resend } from "resend";

export interface TimesheetEmailData {
  submission_id: string;
  laminator_name: string;
  job_number: string;
  client: string | null;
  site_location: string | null;
  description: string;
  work_date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  submitted_at: string;
}

export async function sendTimesheetEmail(d: TimesheetEmailData, recipients: string[]) {
  if (!recipients.length) return;
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — skipping timesheet email send.");
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = `
    <div style="font-family: Arial, sans-serif; color:#111; max-width:600px;">
      <h2 style="margin-bottom:4px;">Time Sheet for Site Work</h2>
      <p style="color:#555;margin-top:0;">${d.submission_id} · ${new Date(d.submitted_at).toLocaleString("en-NZ")}</p>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        ${row("Submitted By", d.laminator_name)}
        ${row("Job Number", d.job_number)}
        ${row("Client", d.client || "—")}
        ${row("Site Location", d.site_location || "—")}
        ${row("Description of Work", d.description)}
        ${row("Work Date", d.work_date)}
        ${row("Hours", `${d.start_time} – ${d.end_time} (${d.total_hours} hrs)`)}
      </table>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: recipients,
    subject: `Time Sheet for Site Work — JOB ${d.job_number} — ${d.laminator_name} — ${d.work_date}`,
    html,
  });

  if (error) {
    throw new Error(`Resend rejected the email: ${error.message || JSON.stringify(error)}`);
  }
  return data;
}

function row(label: string, value: string) {
  return `<tr><td style="padding:4px 8px;color:#666;border-bottom:1px solid #eee;">${label}</td><td style="padding:4px 8px;font-weight:600;border-bottom:1px solid #eee;">${value}</td></tr>`;
}
