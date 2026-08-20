"use client";

import { useRouter } from "next/navigation";

export function WizardNav({
  backHref,
  nextHref,
  nextLabel = "Next",
  onBeforeNext,
  nextDisabled,
}: {
  backHref?: string;
  nextHref?: string;
  nextLabel?: string;
  onBeforeNext?: () => boolean | Promise<boolean>; // return false to block navigation
  nextDisabled?: boolean;
}) {
  const router = useRouter();

  async function handleNext() {
    if (onBeforeNext) {
      const ok = await onBeforeNext();
      if (!ok) return;
    }
    if (nextHref) router.push(nextHref);
  }

  return (
    <div className="sticky bottom-0 z-20 bg-ink/95 backdrop-blur border-t border-line px-4 py-3 flex gap-3">
      {backHref ? (
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="flex-1 min-h-touch rounded-xl border-2 border-line text-paper font-bold text-lg active:scale-[0.98]"
        >
          Back
        </button>
      ) : (
        <div className="flex-1" />
      )}
      <button
        type="button"
        disabled={nextDisabled}
        onClick={handleNext}
        className="flex-[2] min-h-touch rounded-xl bg-accent text-ink font-bold text-lg disabled:opacity-40 active:scale-[0.98]"
      >
        {nextLabel}
      </button>
    </div>
  );
}
