"use client";

interface Props<T extends string> {
  options: readonly T[];
  value: T[] | T;
  multi?: boolean;
  onChange: (value: any) => void;
  columns?: 2 | 3;
}

export function SegmentedControl<T extends string>({ options, value, multi, onChange, columns = 2 }: Props<T>) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  function toggle(opt: T) {
    if (multi) {
      const isSel = selected.includes(opt);
      onChange(isSel ? selected.filter((o) => o !== opt) : [...selected, opt]);
    } else {
      onChange(opt);
    }
  }

  return (
    <div className={`grid gap-2 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {options.map((opt) => {
        const isSel = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`min-h-touch rounded-xl px-3 py-3 text-base font-semibold transition-colors border-2 active:scale-[0.98] ${
              isSel
                ? "bg-accent border-accent text-ink"
                : "bg-panel border-line text-paper"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
