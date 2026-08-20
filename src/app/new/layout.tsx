import { ProgressBar } from "@/components/wizard/ProgressBar";

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <ProgressBar />
      <div className="flex-1 px-4 py-5 pb-24">{children}</div>
    </div>
  );
}
