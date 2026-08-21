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
  completed_at: string;
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
  job_number: string;
  resin_type: ResinType | "";
  job_details: string;

  // MATERIALS
  resin_weight_kg: string;
  glass_weight_kg: string;
  catalyst_percentage: string;
  resin_batch_no: string;
  glass_batch_no: string;

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
