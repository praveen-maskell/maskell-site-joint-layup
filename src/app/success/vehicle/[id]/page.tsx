import Link from "next/link";
import { createServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VehicleClaimSuccessPage({ params }: { params: { id: string } }) {
  const supabase = createServiceSupabase();
  const { data: claim } = await supabase
    .from("site_vehicle_claims")
    .select("submission_id, total_km")
    .eq("id", params.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-good/20 border-4 border-good flex items-center justify-center mb-6">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3">
          <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold text-paper mb-2">CLAIM SUBMITTED</h1>
      {claim && (
        <div className="text-paper/70 space-y-1 mb-8">
          <p>Distance: <span className="text-paper font-semibold">{claim.total_km} km</span></p>
          <p>Reference: <span className="text-accent font-semibold">{claim.submission_id}</span></p>
        </div>
      )}
      <p className="text-paper/50 text-sm mb-8">Submitted successfully.</p>
      <div className="w-full max-w-xs space-y-3">
        <Link
          href="/vehicle"
          className="min-h-touch w-full rounded-xl bg-accent text-ink font-bold text-lg flex items-center justify-center"
        >
          Log Another Claim
        </Link>
        <Link
          href="/"
          className="min-h-touch w-full rounded-xl border-2 border-line text-paper font-bold text-lg flex items-center justify-center"
        >
          Back to Start
        </Link>
      </div>
    </div>
  );
}
