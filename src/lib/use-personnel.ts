"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Personnel } from "@/lib/types";

export function usePersonnel() {
  const [laminators, setLaminators] = useState<Personnel[]>([]);
  const [supervisors, setSupervisors] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("authorised_personnel")
      .select("id, full_name, role")
      .eq("active", true)
      .order("full_name")
      .then(({ data }) => {
        const rows = (data ?? []) as Personnel[];
        setLaminators(rows.filter((r) => r.role === "laminator"));
        setSupervisors(rows.filter((r) => r.role === "supervisor"));
        setLoading(false);
      });
  }, []);

  return { laminators, supervisors, loading };
}
