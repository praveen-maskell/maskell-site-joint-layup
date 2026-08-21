import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { WizardState, ConstructionStage, InspectionResult, CapturedPhoto } from "@/lib/types";
import { INSPECTION_ITEMS, MAX_CONSTRUCTION_STAGES } from "@/lib/constants";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyState(): WizardState {
  return {
    draftId: uuid(),
    laminator_ids: [],
    laminator_names: [],
    job_number: "",
    job_details: "",
    temperature_c: "",
    weather: [],
    position_of_work: "",
    resin_type: "",
    resin_weight_kg: "",
    glass_weight_kg: "",
    catalyst_percentage: "",
    resin_batch_no: "",
    glass_batch_no: "",
    joint_prep_detail: "",
    tack_detail: "",
    tack_width_mm: "",
    construction_stages: [{ stage_no: 1, position: "", detail: null, width_mm: "" }],
    finish_detail: "",
    finish_width_mm: "",
    flocoat: false,
    flocoat_colour: "",
    wax_coat_details: "",
    inspections: INSPECTION_ITEMS.map((item) => ({ item, result: null, details: null })),
    photos: [],
    work_date: todayISO(),
  };
}

interface WizardStore {
  data: WizardState;
  submitting: boolean;
  submitError: string | null;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  toggleLaminator: (id: string, name: string) => void;
  updateConstructionStage: (stage_no: number, patch: Partial<ConstructionStage>) => void;
  addConstructionStage: () => void;
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
      toggleLaminator: (id, name) =>
        set((s) => {
          const included = s.data.laminator_ids.includes(id);
          return {
            data: {
              ...s.data,
              laminator_ids: included ? s.data.laminator_ids.filter((x) => x !== id) : [...s.data.laminator_ids, id],
              laminator_names: included ? s.data.laminator_names.filter((n) => n !== name) : [...s.data.laminator_names, name],
            },
          };
        }),
      updateConstructionStage: (stage_no, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            construction_stages: s.data.construction_stages.map((st) =>
              st.stage_no === stage_no ? { ...st, ...patch } : st
            ),
          },
        })),
      addConstructionStage: () =>
        set((s) => {
          if (s.data.construction_stages.length >= MAX_CONSTRUCTION_STAGES) return s;
          const nextNo = s.data.construction_stages.length + 1;
          return {
            data: {
              ...s.data,
              construction_stages: [
                ...s.data.construction_stages,
                { stage_no: nextNo, position: "", detail: null, width_mm: "" },
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
