import type { WeatherOption, PositionOfWork, InspectionItem } from "./types";

export const WEATHER_OPTIONS: WeatherOption[] = [
  "Sunny", "Windy", "Overcast", "Raining", "Hail", "Fog", "Snow",
];

export const POSITION_OF_WORK_OPTIONS: PositionOfWork[] = [
  "In Trench", "Out of Trench", "Supported Above Ground",
  "Inside", "Outside", "Ground Level and Cradles",
];

export const INSPECTION_ITEMS: InspectionItem[] = [
  "Chips", "Delamination", "Blisters", "Exposed Fibres", "Pinholes", "Air Pockets",
];

// Layup step templates — mirrors Form F.5.65's step sequence.
// Step 1 always defaults to "Check Joint Preparation"; steps 6-8 are
// blank/optional slots on the paper form, exposed here as an "Add step".
export const LAYUP_STEP_TEMPLATES: { step_no: number; label: string; defaultDetail?: string }[] = [
  { step_no: 1, label: "Check Joint Preparation", defaultDetail: "N/A" },
  { step_no: 2, label: "Construction Details - Tack" },
  { step_no: 3, label: "Construction Details - External (1)" },
  { step_no: 4, label: "Construction Details - External (2)" },
  { step_no: 5, label: "Finish - External" },
];

// Predefined selectable detail options per step, to minimise typing.
// "Other" always falls back to a free-text field.
export const LAYUP_DETAIL_OPTIONS: Record<string, string[]> = {
  "Check Joint Preparation": ["Grind & Clean OK", "Surface Prepared", "Chamfer Checked", "N/A"],
  "Construction Details - Tack": ["Tack Coat Resin", "Chopped Strand Mat Tack", "Surfacing Veil"],
  "Construction Details - External (1)": ["1x CSM 450", "2x CSM 450", "Woven Roving", "Combination Mat"],
  "Construction Details - External (2)": ["1x CSM 450", "2x CSM 450", "Woven Roving", "Combination Mat"],
  "Finish - External": ["Resin Rich Finish", "Surfacing Veil + Topcoat", "Sanded Smooth"],
};

export const FLOCOAT_COLOURS = ["Grey", "Black", "Blue", "Green", "White", "Custom"];

export const WIZARD_STEPS = [
  { path: "/new", label: "Job" },
  { path: "/new/materials", label: "Materials" },
  { path: "/new/site", label: "Site" },
  { path: "/new/layup", label: "Layup" },
  { path: "/new/inspection", label: "Inspection" },
  { path: "/new/photos", label: "Photos" },
  { path: "/new/review", label: "Review" },
] as const;
