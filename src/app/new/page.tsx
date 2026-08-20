"use client";

import { useWizardStore } from "@/store/wizard-store";
import { TextField } from "@/components/ui/TextField";
import { WizardNav } from "@/components/wizard/WizardNav";

export default function JobStep() {
  const { data, set } = useWizardStore();

  function validate() {
    if (!data.job_number.trim() || !data.dwg_no.trim() || !data.joint_id.trim()) {
      alert("Job Number, DWG No. and Joint ID are required.");
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-paper">Job &amp; Joint</h1>

      <TextField label="Job Number" required value={data.job_number} onChange={(v) => set("job_number", v)} placeholder="e.g. 1055-25" uppercase />
      <TextField label="DWG No." required value={data.dwg_no} onChange={(v) => set("dwg_no", v)} placeholder="Drawing number" uppercase />
      <TextField label="Joint ID" required value={data.joint_id} onChange={(v) => set("joint_id", v)} placeholder="e.g. J-03" uppercase />

      <div className="grid grid-cols-2 gap-3">
        <TextField label="Diameter (DN)" value={data.dn} onChange={(v) => set("dn", v)} placeholder="e.g. DN300" />
        <TextField label="Bar (PN)" value={data.pn} onChange={(v) => set("pn", v)} placeholder="e.g. PN16" />
      </div>

      <TextField label="Resin Type" value={data.resin_type} onChange={(v) => set("resin_type", v)} placeholder="e.g. Vinyl Ester" />
      <TextField label="Laminate Details" value={data.laminate_details} onChange={(v) => set("laminate_details", v)} placeholder="Optional" />
      <TextField label="Batch No." value={data.batch_no} onChange={(v) => set("batch_no", v)} placeholder="Optional" />

      <WizardNav nextHref="/new/materials" onBeforeNext={validate} />
    </div>
  );
}
