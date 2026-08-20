// Generates SJ-<year>-<sequential> using a Postgres sequence so it's
// collision-free even with concurrent submissions from multiple sites.
// Requires the sequence created in supabase/schema.sql (see below) OR,
// simpler for v1: derive from a count query inside the same DB transaction
// via the RPC in supabase/submission_id.sql.
export function currentYear() {
  return new Date().getFullYear();
}
