"use client";

import { usePathname } from "next/navigation";
import { WIZARD_STEPS } from "@/lib/constants";

export function ProgressBar() {
  const pathname = usePathname();
  const currentIndex = Math.max(0, WIZARD_STEPS.findIndex((s) => s.path === pathname));
  const total = WIZARD_STEPS.length;

  return (
    <div className="sticky top-0 z-20 bg-ink/95 backdrop-blur border-b border-line px-4 pt-3 pb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-paper/80">
          {WIZARD_STEPS[currentIndex]?.label}
        </span>
        <span className="text-sm font-mono text-accent">
          {currentIndex + 1} / {total}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
