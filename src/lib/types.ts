export type WeatherOption =
  | "Sunny" | "Windy" | "Overcast" | "Raining" | "Hail" | "Fog" | "Snow";

export type PositionOfWork =
  | "In Trench" | "Out of Trench" | "Supported Above Ground"
  | "Inside" | "Outside" | "Ground Level and Cradles";

export type InspectionItem =
  | "Chips" | "Delamination" | "Blisters" | "Exposed Fibres" | "Pinholes" | "Air Pockets";

export type InspectionOutcome = "OK" | "DEFECT";

export type PhotoType = "Joint Before Work" | "Completed Joint / Layup";

export type ResinType = "580T" | "580N" | "901" | "907";

export type ConstructionPosition = "Internal" | "External" | "Both";

export interface Personnel {
  id: string;
  full_name: string;
  role: "laminator" | "supervisor" | "worker";
}

// One dynamic construction stage — starts with 1, up to 5 total.
export interface ConstructionStage {
  stage_no: number;
  position: ConstructionPosition | "";
  detail: string | null;
  width_mm: string;
}

// A saved layup step record as read back from the database (PDF/admin views).
export interface LayupStepRecord {
  step_no: number;
  step_label: string;
  detail: string | null;
  width_mm: number | null;
  position?: string | null;
}

export interface InspectionResult {
  item: InspectionItem;
  result: InspectionOutcome | null; // null until the worker explicitly taps OK or DEFECT
  details: string | null;
}

export interface CapturedPhoto {
  photo_type: PhotoType;
  file: File;
  previewUrl: string;
}

export interface WizardState {
  draftId: string; // idempotency key, generated client-side once per new submission

  // JOB
  laminator_ids: string[];
  laminator_names: string[];
  job_number: string;
  job_details: string;

  // SITE
  temperature_c: string;
  weather: WeatherOption[];
  position_of_work: PositionOfWork | "";

  // MATERIALS
  resin_type: ResinType | "";
  resin_weight_kg: string;
  glass_weight_kg: string;
  catalyst_percentage: string;
  resin_batch_no: string;
  glass_batch_no: string;

  // LAYUP
  joint_prep_detail: string;
  tack_detail: string;
  tack_width_mm: string;
  construction_stages: ConstructionStage[];
  finish_detail: string;
  finish_width_mm: string;

  // FLOCOAT
  flocoat: boolean;
  flocoat_colour: string;
  flocoat_weight_kg: string;
  wax_coat_details: string;

  // INSPECTION
  inspections: InspectionResult[];

  // PHOTOS
  photos: CapturedPhoto[];

  // REVIEW
  work_date: string; // YYYY-MM-DD, defaults to today, editable at the end
}
