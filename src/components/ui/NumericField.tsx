"use client";

export function NumericField({
  label, value, onChange, unit, required, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-paper/80 mb-1">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]*"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^\d*\.?\d*$/.test(v)) onChange(v);
          }}
          className="w-full min-h-touch rounded-xl bg-panel border-2 border-line px-4 text-lg text-paper placeholder:text-paper/30 focus:border-accent focus:outline-none"
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-paper/50 text-base">
            {unit}
          </span>
        )}
      </div>
    </label>
  );
}
