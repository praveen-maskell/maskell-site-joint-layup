import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { sendTimesheetEmail } from "@/lib/timesheet-email";

export async function POST(req: NextRequest) {
  try {
    const { timesheetRecordId, force } = await req.json();
    if (!timesheetRecordId) return NextResponse.json({ error: "timesheetRecordId required" }, { status: 400 });

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set in this deployment's environment variables." }, { status: 500 });
    }

    const db = createServiceSupabase();

    const { data: ts, error: tsErr } = await db
      .from("site_timesheets")
      .select("*")
      .eq("id", timesheetRecordId)
      .single();

    if (tsErr) return NextResponse.json({ error: `Lookup failed: ${tsErr.message}` }, { status: 500 });
    if (!ts) return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
    if (ts.emailed_at && !force) return NextResponse.json({ ok: true, alreadyFinalized: true });

    const { data: recipients, error: recErr } = await db
      .from("notification_settings")
      .select("email")
      .eq("active", true)
      .eq("category", "timesheet");
    if (recErr) return NextResponse.json({ error: `Recipient lookup failed: ${recErr.message}` }, { status: 500 });

    const recipientEmails = (recipients ?? []).map((r: any) => r.email);
    let emailWarning: string | null = null;
    if (recipientEmails.length === 0) {
      emailWarning = "No active timesheet recipients configured in /admin/recipients — record was saved but no email was sent.";
    } else {
      try {
        await sendTimesheetEmail(
          {
            submission_id: ts.submission_id,
            laminator_name: ts.laminator_name,
            job_number: ts.job_number,
            client: ts.client,
            site_location: ts.site_location,
            description: ts.description,
            work_date: ts.work_date,
            start_time: ts.start_time,
            end_time: ts.end_time,
            total_hours: ts.total_hours,
            submitted_at: ts.submitted_at,
          },
          recipientEmails
        );
      } catch (e: any) {
        emailWarning = `Email send failed: ${e?.message || e}`;
      }
    }

    await db
      .from("site_timesheets")
      .update({ emailed_at: new Date().toISOString() })
      .eq("id", timesheetRecordId);

    return NextResponse.json({ ok: true, warning: emailWarning });
  } catch (e: any) {
    return NextResponse.json({ error: `Unexpected error: ${e?.message || e}` }, { status: 500 });
  }
}
