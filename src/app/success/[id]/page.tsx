import Link from "next/link";
import { createServiceSupabase } from "@/lib/supabase/server";

export default async function SuccessPage({ params }: { params: { id: string } }) {
  const supabase = createServiceSupabase();
  const { data: sub } = await supabase
    .from("site_joint_submissions")
    .select("submission_id, job_number")
    .eq("id", params.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-good/20 border-4 border-good flex items-center justify-center mb-6">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3">
          <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold text-paper mb-2">SITE JOINT RECORD SUBMITTED</h1>
      {sub && (
        <div className="text-paper/70 space-y-1 mb-8">
          <p>Job: <span className="text-paper font-semibold">{sub.job_number}</span></p>
          <p>Submission: <span className="text-accent font-semibold">{sub.submission_id}</span></p>
        </div>
      )}
      <p className="text-paper/50 text-sm mb-8">Submitted successfully. A QA record has been emailed to the notification list.</p>
      <Link
        href="/new"
        className="min-h-touch w-full max-w-xs rounded-xl bg-accent text-ink font-bold text-lg flex items-center justify-center"
      >
        Start Next Joint
      </Link>
    </div>
  );
}
