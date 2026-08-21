import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createServerSupabase();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false as const, status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userRes.user.id).single();
  if (profile?.role !== "admin") return { ok: false as const, status: 403 };
  return { ok: true as const, supabase };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  const { full_name, role } = await req.json();
  if (!full_name || !["laminator", "supervisor", "worker"].includes(role)) {
    return NextResponse.json({ error: "full_name and valid role required" }, { status: 400 });
  }
  const { error } = await auth.supabase.from("authorised_personnel").insert({ full_name, role });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  const { id, active } = await req.json();
  const { error } = await auth.supabase.from("authorised_personnel").update({ active }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
