import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-ink/95 backdrop-blur border-b border-line px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-paper">Maskell QA Admin</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="text-paper/70 hover:text-accent">Records</Link>
          <Link href="/admin/personnel" className="text-paper/70 hover:text-accent">Personnel</Link>
          <Link href="/admin/recipients" className="text-paper/70 hover:text-accent">Recipients</Link>
          <Link href="/new" className="text-accent">+ New</Link>
        </nav>
      </header>
      <main className="px-4 py-5 max-w-3xl mx-auto">{children}</main>
    </div>
  );
}
