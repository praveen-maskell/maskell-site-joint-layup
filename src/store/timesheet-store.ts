import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { TimesheetState } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyState(): TimesheetState {
  return {
    draftId: uuid(),
    laminator_id: "",
    laminator_name: "",
    job_number: "",
    client: "",
    site_location: "",
    description: "",
    work_date: todayISO(),
    start_time: "",
    end_time: "",
  };
}

interface TimesheetStore {
  data: TimesheetState;
  submitting: boolean;
  submitError: string | null;
  set: <K extends keyof TimesheetState>(key: K, value: TimesheetState[K]) => void;
  selectLaminator: (id: string, name: string) => void;
  setSubmitting: (v: boolean) => void;
  setSubmitError: (v: string | null) => void;
  reset: () => void;
}

export const useTimesheetStore = create<TimesheetStore>()(
  persist(
    (set) => ({
      data: emptyState(),
      submitting: false,
      submitError: null,
      set: (key, value) => set((s) => ({ data: { ...s.data, [key]: value } })),
      selectLaminator: (id, name) =>
        set((s) => ({ data: { ...s.data, laminator_id: id, laminator_name: name } })),
      setSubmitting: (v) => set({ submitting: v }),
      setSubmitError: (v) => set({ submitError: v }),
      reset: () => set({ data: emptyState(), submitting: false, submitError: null }),
    }),
    {
      name: "maskell-timesheet-draft",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
