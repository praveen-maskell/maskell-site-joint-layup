import Link from "next/link";

export default function TimesheetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-20 bg-ink/95 backdrop-blur border-b border-line px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-paper/50 text-sm">&larr; Change form</Link>
        <span className="text-sm font-semibold text-paper/80">Time Sheet</span>
      </div>
      <div className="flex-1 px-4 py-5 pb-24">{children}</div>
    </div>
  );
}
