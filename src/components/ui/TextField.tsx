"use client";

export function TextField({
  label, value, onChange, required, placeholder, uppercase,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  uppercase?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-paper/80 mb-1">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
        className="w-full min-h-touch rounded-xl bg-panel border-2 border-line px-4 text-lg text-paper placeholder:text-paper/30 focus:border-accent focus:outline-none"
      />
    </label>
  );
}
