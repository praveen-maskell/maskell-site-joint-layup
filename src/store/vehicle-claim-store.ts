import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { VehicleClaimState, CapturedPhoto } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyState(): VehicleClaimState {
  return {
    draftId: uuid(),
    laminator_id: "",
    laminator_name: "",
    work_date: todayISO(),
    start_photo: null,
    finish_photo: null,
  };
}

interface VehicleClaimStore {
  data: VehicleClaimState;
  submitting: boolean;
  submitError: string | null;
  set: <K extends keyof VehicleClaimState>(key: K, value: VehicleClaimState[K]) => void;
  selectLaminator: (id: string, name: string) => void;
  setStartPhoto: (photo: CapturedPhoto | null) => void;
  setFinishPhoto: (photo: CapturedPhoto | null) => void;
  setSubmitting: (v: boolean) => void;
  setSubmitError: (v: string | null) => void;
  reset: () => void;
}

// Photos hold File objects (not JSON-serialisable), so they're excluded from
// the persisted slice — same pattern as the other wizards.
export const useVehicleClaimStore = create<VehicleClaimStore>()(
  persist(
    (set) => ({
      data: emptyState(),
      submitting: false,
      submitError: null,
      set: (key, value) => set((s) => ({ data: { ...s.data, [key]: value } })),
      selectLaminator: (id, name) =>
        set((s) => ({ data: { ...s.data, laminator_id: id, laminator_name: name } })),
      setStartPhoto: (photo) => set((s) => ({ data: { ...s.data, start_photo: photo } })),
      setFinishPhoto: (photo) => set((s) => ({ data: { ...s.data, finish_photo: photo } })),
      setSubmitting: (v) => set({ submitting: v }),
      setSubmitError: (v) => set({ submitError: v }),
      reset: () => set({ data: emptyState(), submitting: false, submitError: null }),
    }),
    {
      name: "maskell-vehicle-claim-draft",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ data: { ...s.data, start_photo: null, finish_photo: null } }),
    }
  )
);
