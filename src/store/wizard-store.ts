import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { WizardState, LayupStep, InspectionResult, CapturedPhoto } from "@/lib/types";
import { LAYUP_STEP_TEMPLATES, INSPECTION_ITEMS } from "@/lib/constants";

function emptyState(): WizardState {
  return {
    draftId: uuid(),
    job_number: "",
    resin_type: "",
    laminate_details: "",
    batch_no: "",
    resin_weight_kg: "",
    glass_weight_kg: "",
    catalyst_weight_kg: "",
    resin_batch_no: "",
    glass_batch_no: "",
    catalyst_batch_no: "",
    temperature_c: "",
    weather: [],
    position_of_work: "",
    layup_steps: LAYUP_STEP_TEMPLATES.map((t) => ({
      step_no: t.step_no,
      step_label: t.label,
      detail: t.defaultDetail ?? null,
      width_mm: null,
      initials: "",
      completed_at: "",
    })),
    flocoat: false,
    flocoat_colour: "",
    wax_coat_details: "",
    inspections: INSPECTION_ITEMS.map((item) => ({ item, result: "OK", details: null })),
    photos: [],
    laminator_id: "",
    supervisor_id: "",
    submitted_by_personnel_id: "",
    submitted_by_name: "",
  };
}

interface WizardStore {
  data: WizardState;
  submitting: boolean;
  submitError: string | null;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  updateLayupStep: (step_no: number, patch: Partial<LayupStep>) => void;
  addExtraLayupStep: () => void;
  updateInspection: (item: InspectionResult["item"], patch: Partial<InspectionResult>) => void;
  addPhoto: (photo: CapturedPhoto) => void;
  removePhoto: (index: number) => void;
  setSubmitting: (v: boolean) => void;
  setSubmitError: (v: string | null) => void;
  reset: () => void;
}

// NOTE: File objects cannot be JSON-serialised for localStorage, so photos
// are kept out of the persisted slice and re-attached in memory only —
// per the offline spec, submission itself (not draft photo storage) is
// queued for retry rather than the raw blobs being persisted across a
// full app close. Every other field IS persisted so a refresh never loses
// entered form data.
export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      data: emptyState(),
      submitting: false,
      submitError: null,
      set: (key, value) => set((s) => ({ data: { ...s.data, [key]: value } })),
      updateLayupStep: (step_no, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            layup_steps: s.data.layup_steps.map((st) =>
              st.step_no === step_no
                ? { ...st, ...patch, completed_at: patch.initials ? new Date().toISOString() : st.completed_at }
                : st
            ),
          },
        })),
      addExtraLayupStep: () =>
        set((s) => {
          const nextNo = Math.max(...s.data.layup_steps.map((s) => s.step_no), 0) + 1;
          return {
            data: {
              ...s.data,
              layup_steps: [
                ...s.data.layup_steps,
                { step_no: nextNo, step_label: `Additional Step ${nextNo}`, detail: null, width_mm: null, initials: "", completed_at: "" },
              ],
            },
          };
        }),
      updateInspection: (item, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            inspections: s.data.inspections.map((i) => (i.item === item ? { ...i, ...patch } : i)),
          },
        })),
      addPhoto: (photo) => set((s) => ({ data: { ...s.data, photos: [...s.data.photos, photo] } })),
      removePhoto: (index) =>
        set((s) => ({ data: { ...s.data, photos: s.data.photos.filter((_, i) => i !== index) } })),
      setSubmitting: (v) => set({ submitting: v }),
      setSubmitError: (v) => set({ submitError: v }),
      reset: () => set({ data: emptyState(), submitting: false, submitError: null }),
    }),
    {
      name: "maskell-site-joint-draft",
      storage: createJSONStorage(() => localStorage),
      // photos hold File objects — exclude from persistence, everything else persists
      partialize: (s) => ({ data: { ...s.data, photos: [] } }),
    }
  )
);
