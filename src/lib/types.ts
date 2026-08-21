export type WeatherOption =
  | "Sunny" | "Windy" | "Overcast" | "Raining" | "Hail" | "Fog" | "Snow";

export type PositionOfWork =
  | "In Trench" | "Out of Trench" | "Supported Above Ground"
  | "Inside" | "Outside" | "Ground Level and Cradles";

export type InspectionItem =
  | "Chips" | "Delamination" | "Blisters" | "Exposed Fibres" | "Pinholes" | "Air Pockets";

export type PhotoType = "Joint Before Work" | "Completed Joint / Layup" | "Final Inspection";

export interface Personnel {
  id: string;
  full_name: string;
  role: "laminator" | "supervisor" | "worker";
}

export interface LayupStep {
  step_no: number;
  step_label: string;
  detail: string | null;
  width_mm: number | null;
  initials: string;
  completed_at: string;
}

export interface InspectionResult {
  item: InspectionItem;
  result: "OK" | "DEFECT";
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
  job_number: string;
  resin_type: string;
  laminate_details: string;
  batch_no: string;

  // MATERIALS
  resin_weight_kg: string;
  glass_weight_kg: string;
  catalyst_weight_kg: string;
  resin_batch_no: string;
  glass_batch_no: string;
  catalyst_batch_no: string;

  // SITE
  temperature_c: string;
  weather: WeatherOption[];
  position_of_work: PositionOfWork | "";

  // LAYUP
  layup_steps: LayupStep[];

  // FLOCOAT
  flocoat: boolean;
  flocoat_colour: string;
  wax_coat_details: string;

  // INSPECTION
  inspections: InspectionResult[];

  // PHOTOS
  photos: CapturedPhoto[];

  // PERSONNEL
  laminator_id: string;
  supervisor_id: string;
  submitted_by_personnel_id: string;
  submitted_by_name: string;
}
