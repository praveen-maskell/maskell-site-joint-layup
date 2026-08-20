"use client";

export function SelectField({
  label, value, onChange, options, required, placeholder = "Select...",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-paper/80 mb-1">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-touch rounded-xl bg-panel border-2 border-line px-4 text-lg text-paper focus:border-accent focus:outline-none"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
