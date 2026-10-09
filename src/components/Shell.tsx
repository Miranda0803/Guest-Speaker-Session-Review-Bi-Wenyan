import { Link } from "@tanstack/react-router";
import { Disc3, LayoutGrid, NotebookPen } from "lucide-react";
import type { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  const link = "flex items-center gap-2 rounded-2xl px-3 py-1.5 font-mono text-sm font-bold";
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b-2 border-accent bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Disc3 className="h-7 w-7 animate-spin [animation-duration:6s]" />
            <span className="font-display text-2xl font-black italic">Vibe Vault</span>
          </Link>
          <nav className="flex gap-1">
            <Link to="/" className={link} activeProps={{ className: "bg-card" }} activeOptions={{ exact: true }}>
              <LayoutGrid className="h-4 w-4" /> Vaults
            </Link>
            <Link to="/notebook" className={link} activeProps={{ className: "bg-card" }}>
              <NotebookPen className="h-4 w-4" /> Notebook
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
