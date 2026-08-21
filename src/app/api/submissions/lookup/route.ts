import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { idempotencyKey } = await req.json();
  if (!idempotencyKey) return NextResponse.json({ error: "idempotencyKey required" }, { status: 400 });

  const db = createServiceSupabase();
  const { data } = await db
    .from("site_joint_submissions")
    .select("id, submission_id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  return NextResponse.json({ submission: data ?? null });
}
