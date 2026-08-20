import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#111" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2 solid #111", paddingBottom: 8, marginBottom: 12 },
  brand: { fontSize: 16, fontWeight: 700 },
  sub: { fontSize: 8, color: "#555" },
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 10, fontWeight: 700, backgroundColor: "#eee", padding: 4, marginBottom: 4 },
  row: { flexDirection: "row", flexWrap: "wrap" },
  field: { width: "33%", marginBottom: 4, paddingRight: 6 },
  label: { fontSize: 7, color: "#666", textTransform: "uppercase" },
  value: { fontSize: 9, fontWeight: 700 },
  table: { border: "1 solid #ccc" },
  tr: { flexDirection: "row", borderBottom: "1 solid #ddd" },
  th: { flex: 1, padding: 3, fontSize: 7, fontWeight: 700, backgroundColor: "#f2f2f2" },
  td: { flex: 1, padding: 3, fontSize: 8 },
  ok: { color: "#1a7a3c", fontWeight: 700 },
  defect: { color: "#b3251b", fontWeight: 700 },
  photosRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  photoBox: { width: 150 },
  photoImg: { width: 150, height: 110, objectFit: "cover" },
  photoCaption: { fontSize: 7, marginTop: 2, textAlign: "center" },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 7, color: "#888", flexDirection: "row", justifyContent: "space-between", borderTop: "1 solid #ddd", paddingTop: 4 },
});

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? "—"}</Text>
    </View>
  );
}

export interface SubmissionPdfData {
  submission_id: string;
  job_number: string;
  dwg_no: string;
  dn: string | null;
  pn: string | null;
  joint_id: string;
  resin_type: string | null;
  laminate_details: string | null;
  batch_no: string | null;
  temperature_c: number | null;
  weather: string[];
  position_of_work: string;
  flocoat: boolean;
  flocoat_colour: string | null;
  wax_coat_details: string | null;
  submitted_at: string;
  laminator_name: string;
  supervisor_name: string;
  submitted_by_name: string;
  materials: {
    resin_weight_kg: number; glass_weight_kg: number; catalyst_weight_kg: number;
    resin_batch_no: string | null; glass_batch_no: string | null; catalyst_batch_no: string | null;
  };
  layup_steps: { step_no: number; step_label: string; detail: string | null; width_mm: number | null; initials: string; completed_at: string }[];
  inspections: { item: string; result: string; details: string | null }[];
  photos: { photo_type: string; signedUrl: string }[];
}

export function SiteJointPdf({ d }: { d: SubmissionPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>MASKELL PRODUCTIONS LTD</Text>
            <Text style={styles.sub}>Site Joint Layup Record — QA Document (ref. Form F.5.65)</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 11, fontWeight: 700 }}>{d.submission_id}</Text>
            <Text style={styles.sub}>{new Date(d.submitted_at).toLocaleString("en-NZ")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>JOB &amp; JOINT</Text>
          <View style={styles.row}>
            <Field label="Job Number" value={d.job_number} />
            <Field label="DWG No." value={d.dwg_no} />
            <Field label="Joint ID" value={d.joint_id} />
            <Field label="Diameter (DN)" value={d.dn} />
            <Field label="Bar (PN)" value={d.pn} />
            <Field label="Resin Type" value={d.resin_type} />
            <Field label="Laminate Details" value={d.laminate_details} />
            <Field label="Batch No." value={d.batch_no} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MATERIAL USED</Text>
          <View style={styles.row}>
            <Field label="Resin Weight" value={`${d.materials.resin_weight_kg} kg`} />
            <Field label="Glass Weight" value={`${d.materials.glass_weight_kg} kg`} />
            <Field label="Catalyst Weight" value={`${d.materials.catalyst_weight_kg} kg`} />
            <Field label="Resin Batch" value={d.materials.resin_batch_no} />
            <Field label="Glass Batch" value={d.materials.glass_batch_no} />
            <Field label="Catalyst Batch" value={d.materials.catalyst_batch_no} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SITE CONDITIONS</Text>
          <View style={styles.row}>
            <Field label="Temperature" value={d.temperature_c != null ? `${d.temperature_c} °C` : null} />
            <Field label="Weather" value={d.weather.join(", ")} />
            <Field label="Position of Work" value={d.position_of_work} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LAYUP</Text>
          <View style={styles.table}>
            <View style={styles.tr}>
              <Text style={styles.th}>Step</Text>
              <Text style={[styles.th, { flex: 2 }]}>Detail / Layup</Text>
              <Text style={styles.th}>Width (mm)</Text>
              <Text style={styles.th}>Initials</Text>
              <Text style={styles.th}>Time</Text>
            </View>
            {d.layup_steps.map((s) => (
              <View style={styles.tr} key={s.step_no}>
                <Text style={styles.td}>{s.step_no}. {s.step_label}</Text>
                <Text style={[styles.td, { flex: 2 }]}>{s.detail ?? "—"}</Text>
                <Text style={styles.td}>{s.width_mm ?? "—"}</Text>
                <Text style={styles.td}>{s.initials}</Text>
                <Text style={styles.td}>{new Date(s.completed_at).toLocaleTimeString("en-NZ")}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FLOCOAT</Text>
          <View style={styles.row}>
            <Field label="FloCoat Applied" value={d.flocoat ? "Yes" : "No"} />
            {d.flocoat && <Field label="Colour" value={d.flocoat_colour} />}
            {d.flocoat && <Field label="Wax Coat" value={d.wax_coat_details} />}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VISUAL INSPECTION</Text>
          <View style={styles.table}>
            <View style={styles.tr}>
              <Text style={styles.th}>Item</Text>
              <Text style={styles.th}>Result</Text>
              <Text style={[styles.th, { flex: 2 }]}>Details</Text>
            </View>
            {d.inspections.map((i) => (
              <View style={styles.tr} key={i.item}>
                <Text style={styles.td}>{i.item}</Text>
                <Text style={[styles.td, i.result === "OK" ? styles.ok : styles.defect]}>{i.result}</Text>
                <Text style={[styles.td, { flex: 2 }]}>{i.details ?? "—"}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERSONNEL</Text>
          <View style={styles.row}>
            <Field label="Laminator" value={d.laminator_name} />
            <Field label="Supervisor" value={d.supervisor_name} />
            <Field label="Submitted By" value={d.submitted_by_name} />
          </View>
        </View>

        {d.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PHOTOS</Text>
            <View style={styles.photosRow}>
              {d.photos.map((p) => (
                <View style={styles.photoBox} key={p.photo_type}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={p.signedUrl} style={styles.photoImg} />
                  <Text style={styles.photoCaption}>{p.photo_type}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Form F.5.65 (1055-25) digital record — Maskell Productions Ltd QA System</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderSiteJointPdf(d: SubmissionPdfData): Promise<Buffer> {
  return renderToBuffer(<SiteJointPdf d={d} />);
}
