import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function AdminRecordsPage({
  searchParams,
}: {
  searchParams: { job?: string; joint?: string; date?: string };
}) {
  const supabase = createServerSupabase();

  let query = supabase
    .from("site_joint_submissions")
    .select("id, submission_id, job_number, joint_id, submitted_at, position_of_work, flocoat")
    .order("submitted_at", { ascending: false })
    .limit(50);

  if (searchParams.job) query = query.ilike("job_number", `%${searchParams.job}%`);
  if (searchParams.joint) query = query.ilike("joint_id", `%${searchParams.joint}%`);
  if (searchParams.date) {
    const start = `${searchParams.date}T00:00:00`;
    const end = `${searchParams.date}T23:59:59`;
    query = query.gte("submitted_at", start).lte("submitted_at", end);
  }

  const { data: records } = await query;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-paper">Site Joint Records</h1>

      <form className="grid grid-cols-3 gap-2" action="/admin">
        <input name="job" defaultValue={searchParams.job} placeholder="Job No." className="min-h-touch rounded-lg bg-panel border-2 border-line px-3 text-paper text-sm" />
        <input name="joint" defaultValue={searchParams.joint} placeholder="Joint ID" className="min-h-touch rounded-lg bg-panel border-2 border-line px-3 text-paper text-sm" />
        <input name="date" type="date" defaultValue={searchParams.date} className="min-h-touch rounded-lg bg-panel border-2 border-line px-3 text-paper text-sm" />
        <button type="submit" className="col-span-3 min-h-touch rounded-lg bg-accent text-ink font-bold text-sm">Search</button>
      </form>

      <div className="space-y-2">
        {(records ?? []).length === 0 && <p className="text-paper/50 text-sm">No records found.</p>}
        {(records ?? []).map((r) => (
          <Link
            key={r.id}
            href={`/admin/submissions/${r.id}`}
            className="block rounded-xl border-2 border-line bg-panel p-3 hover:border-accent"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-paper">{r.job_number} · {r.joint_id}</span>
              <span className="text-accent text-sm font-mono">{r.submission_id}</span>
            </div>
            <div className="text-paper/50 text-xs mt-1">
              {new Date(r.submitted_at).toLocaleString("en-NZ")} · {r.position_of_work} {r.flocoat ? "· FloCoat" : ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
