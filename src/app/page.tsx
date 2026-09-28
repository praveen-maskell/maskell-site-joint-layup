import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-8">
      <div>
        <h1 className="text-2xl font-extrabold text-paper mb-1">Maskell Productions</h1>
        <p className="text-paper/50 text-sm">Choose a form to fill out</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Link
          href="/new"
          className="flex flex-col items-center justify-center gap-1 w-full min-h-[6.5rem] rounded-2xl bg-accent text-ink px-6 py-5 active:scale-[0.98]"
        >
          <span className="text-lg font-extrabold">Site Joint Layup</span>
          <span className="text-sm font-medium opacity-80">QA record for a joint layup</span>
        </Link>

        <Link
          href="/timesheet"
          className="flex flex-col items-center justify-center gap-1 w-full min-h-[6.5rem] rounded-2xl border-2 border-line bg-panel text-paper px-6 py-5 active:scale-[0.98]"
        >
          <span className="text-lg font-extrabold">Time Sheet</span>
          <span className="text-sm font-medium text-paper/60">Log hours worked for the day</span>
        </Link>
      </div>
    </div>
  );
}
