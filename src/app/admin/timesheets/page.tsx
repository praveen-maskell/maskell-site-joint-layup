import { createServerSupabase } from "@/lib/supabase/server";
import { ResendTimesheetButton } from "@/components/admin/ResendTimesheetButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTimesheetsPage({
  searchParams,
}: {
  searchParams: { job?: string; date?: string };
}) {
  const supabase = createServerSupabase();

  let query = supabase
    .from("site_timesheets")
    .select("id, submission_id, job_number, client, site_location, laminator_name, work_date, start_time, end_time, total_hours, submitted_at, emailed_at")
    .order("work_date", { ascending: false })
    .order("submitted_at", { ascending: false })
    .limit(100);

  if (searchParams.job) query = query.ilike("job_number", `%${searchParams.job}%`);
  if (searchParams.date) query = query.eq("work_date", searchParams.date);

  const { data: records } = await query;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-paper">Time Sheets</h1>

      <form className="grid grid-cols-2 gap-2" action="/admin/timesheets">
        <input name="job" defaultValue={searchParams.job} placeholder="Job No." className="min-h-touch rounded-lg bg-panel border-2 border-line px-3 text-paper text-sm" />
        <input name="date" type="date" defaultValue={searchParams.date} className="min-h-touch rounded-lg bg-panel border-2 border-line px-3 text-paper text-sm" />
        <button type="submit" className="col-span-2 min-h-touch rounded-lg bg-accent text-ink font-bold text-sm">Search</button>
      </form>

      <div className="space-y-2">
        {(records ?? []).length === 0 && <p className="text-paper/50 text-sm">No time sheets found.</p>}
        {(records ?? []).map((r) => (
          <div key={r.id} className="rounded-xl border-2 border-line bg-panel p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-paper">{r.job_number}{r.client ? ` — ${r.client}` : ""}</span>
              <span className="text-accent text-sm font-mono">{r.total_hours} hrs</span>
            </div>
            <div className="text-paper/60 text-xs">
              {r.laminator_name} · {r.work_date} · {r.start_time}–{r.end_time}
            </div>
            {r.site_location && (
              <div className="text-paper/40 text-[11px]">📍 {r.site_location}</div>
            )}
            <div className="text-paper/40 text-[11px]">
              {r.emailed_at ? "Emailed" : "Not yet emailed"} · submitted {new Date(r.submitted_at).toLocaleString("en-NZ")}
            </div>
            <ResendTimesheetButton timesheetRecordId={r.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
