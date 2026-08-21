import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();

  const { data: sub } = await supabase
    .from("site_joint_submissions")
    .select(
      `*, materials:site_joint_materials(*), layup_steps:site_joint_layup_steps(*),
       inspections:site_joint_inspections(*), photos:site_joint_photos(*),
       laminator:authorised_personnel!site_joint_submissions_laminator_id_fkey(full_name),
       supervisor:authorised_personnel!site_joint_submissions_supervisor_id_fkey(full_name)`
    )
    .eq("id", params.id)
    .single();

  if (!sub) notFound();

  let pdfUrl: string | null = null;
  if (sub.pdf_storage_path) {
    const { data } = await supabase.storage.from("site-joint-pdfs").createSignedUrl(sub.pdf_storage_path, 3600);
    pdfUrl = data?.signedUrl ?? null;
  }

  const photosWithUrls = await Promise.all(
    (sub.photos ?? []).map(async (p: any) => {
      const { data } = await supabase.storage.from("site-joint-photos").createSignedUrl(p.storage_path, 3600);
      return { ...p, url: data?.signedUrl };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-paper">{sub.job_number} · {sub.joint_id}</h1>
          <p className="text-accent font-mono text-sm">{sub.submission_id}</p>
        </div>
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" className="min-h-touch px-4 flex items-center rounded-xl bg-accent text-ink font-bold text-sm">
            Download PDF
          </a>
        )}
      </div>

      <Section title="Job & Joint">
        <Grid>
          <Item label="DWG No." value={sub.dwg_no} />
          <Item label="DN" value={sub.dn} />
          <Item label="PN" value={sub.pn} />
          <Item label="Resin Type" value={sub.resin_type} />
          <Item label="Laminate Details" value={sub.laminate_details} />
          <Item label="Batch No." value={sub.batch_no} />
        </Grid>
      </Section>

      <Section title="Material Used">
        <Grid>
          <Item label="Resin Weight" value={`${sub.materials?.resin_weight_kg} kg`} />
          <Item label="Glass Weight" value={`${sub.materials?.glass_weight_kg} kg`} />
          <Item label="Catalyst Weight" value={`${sub.materials?.catalyst_weight_kg} kg`} />
          <Item label="Resin Batch" value={sub.materials?.resin_batch_no} />
          <Item label="Glass Batch" value={sub.materials?.glass_batch_no} />
          <Item label="Catalyst Batch" value={sub.materials?.catalyst_batch_no} />
        </Grid>
      </Section>

      <Section title="Site Conditions">
        <Grid>
          <Item label="Temperature" value={sub.temperature_c != null ? `${sub.temperature_c} °C` : "—"} />
          <Item label="Weather" value={(sub.weather ?? []).join(", ") || "—"} />
          <Item label="Position of Work" value={sub.position_of_work} />
        </Grid>
      </Section>

      <Section title="Layup Steps">
        <div className="space-y-1">
          {(sub.layup_steps ?? []).sort((a: any, b: any) => a.step_no - b.step_no).map((s: any) => (
            <div key={s.step_no} className="flex justify-between text-sm border-b border-line py-1">
              <span className="text-paper/70">{s.step_no}. {s.step_label} — {s.detail ?? "—"}</span>
              <span className="text-paper">{s.width_mm ? `${s.width_mm}mm ` : ""}{s.initials} · {new Date(s.completed_at).toLocaleTimeString("en-NZ")}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="FloCoat">
        <Grid>
          <Item label="Applied" value={sub.flocoat ? "Yes" : "No"} />
          {sub.flocoat && <Item label="Colour" value={sub.flocoat_colour} />}
          {sub.flocoat && <Item label="Wax Coat" value={sub.wax_coat_details} />}
        </Grid>
      </Section>

      <Section title="Visual Inspection">
        <div className="space-y-1">
          {(sub.inspections ?? []).map((i: any) => (
            <div key={i.item} className="flex justify-between text-sm border-b border-line py-1">
              <span className="text-paper/70">{i.item}</span>
              <span className={i.result === "OK" ? "text-good font-semibold" : "text-bad font-semibold"}>
                {i.result}{i.details ? ` — ${i.details}` : ""}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Personnel">
        <Grid>
          <Item label="Laminator" value={sub.laminator?.full_name} />
          <Item label="Supervisor" value={sub.supervisor?.full_name} />
          <Item label="Submitted By" value={sub.submitted_by_name} />
          <Item label="Submitted At" value={new Date(sub.submitted_at).toLocaleString("en-NZ")} />
        </Grid>
      </Section>

      {photosWithUrls.length > 0 && (
        <Section title="Photos">
          <div className="grid grid-cols-3 gap-2">
            {photosWithUrls.map((p) => (
              <a key={p.id} href={p.url} target="_blank">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.photo_type} className="w-full h-24 object-cover rounded-lg border-2 border-line" />
                <p className="text-paper/50 text-[10px] mt-1 text-center">{p.photo_type}</p>
              </a>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-line bg-panel p-4">
      <h2 className="text-sm font-bold text-paper/80 mb-3 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{children}</div>;
}
function Item({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-paper/40 text-[10px] uppercase">{label}</p>
      <p className="text-paper text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}
