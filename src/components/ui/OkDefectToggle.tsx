"use client";

export function OkDefectToggle({
  value,
  onChange,
}: {
  value: "OK" | "DEFECT";
  onChange: (v: "OK" | "DEFECT") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange("OK")}
        className={`min-h-touch rounded-xl text-base font-bold border-2 ${
          value === "OK" ? "bg-good border-good text-ink" : "bg-panel border-line text-paper"
        }`}
      >
        OK
      </button>
      <button
        type="button"
        onClick={() => onChange("DEFECT")}
        className={`min-h-touch rounded-xl text-base font-bold border-2 ${
          value === "DEFECT" ? "bg-bad border-bad text-white" : "bg-panel border-line text-paper"
        }`}
      >
        DEFECT
      </button>
    </div>
  );
}
