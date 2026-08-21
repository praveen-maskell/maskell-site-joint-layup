import type { WeatherOption, PositionOfWork, InspectionItem, ResinType, ConstructionPosition } from "./types";

export const WEATHER_OPTIONS: WeatherOption[] = [
  "Sunny", "Windy", "Overcast", "Raining", "Hail", "Fog", "Snow",
];

export const RESIN_TYPES: ResinType[] = ["580T", "580N", "901", "907"];

export const CATALYST_PERCENTAGE_OPTIONS = ["1%", "1.25%", "1.5%", "1.75%", "2%"];

export const POSITION_OF_WORK_OPTIONS: PositionOfWork[] = [
  "In Trench", "Out of Trench", "Supported Above Ground",
  "Inside", "Outside", "Ground Level and Cradles",
];

export const INSPECTION_ITEMS: InspectionItem[] = [
  "Chips", "Delamination", "Blisters", "Exposed Fibres", "Pinholes", "Air Pockets",
];

export const CONSTRUCTION_POSITIONS: ConstructionPosition[] = ["Internal", "External", "Both"];

export const MAX_CONSTRUCTION_STAGES = 5;

// Predefined selectable detail options, to minimise typing.
// "Other" is always offered alongside these as a free-text fallback.
export const JOINT_PREP_OPTIONS = ["Grind & Clean OK"];
export const TACK_DETAIL_OPTIONS = ["Tack Coat Resin", "Chopped Strand Mat Tack", "Surfacing Veil"];
export const CONSTRUCTION_LAYUP_OPTIONS = ["1x CSM 450", "2x CSM 450", "Woven Roving", "Combination Mat"];
export const FINISH_DETAIL_OPTIONS = ["Resin Rich Finish", "Surfacing Veil + Topcoat", "Sanded Smooth"];

export const FLOCOAT_COLOURS = ["Grey", "Black", "Blue", "Green", "White", "Custom"];

export const WIZARD_STEPS = [
  { path: "/new", label: "Job" },
  { path: "/new/site", label: "Site" },
  { path: "/new/materials", label: "Materials" },
  { path: "/new/layup", label: "Layup" },
  { path: "/new/inspection", label: "Inspection" },
  { path: "/new/photos", label: "Photos" },
  { path: "/new/review", label: "Review" },
] as const;
