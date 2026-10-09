import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Mic2, Calendar, Award, X, Library, Target, BookCheck } from "lucide-react";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vibe Vault — Speaker Review & AI Quizzes" },
      { name: "description", content: "Save talk slides and notes, then test yourself with AI quizzes." },
      { property: "og:title", content: "Vibe Vault — Speaker Review & AI Quizzes" },
      { property: "og:description", content: "Save talk slides and notes, then test yourself with AI quizzes." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { vaults, notes } = useStore();
  const [open, setOpen] = useState(false);
  const scored = vaults.filter((v) => v.score);
  const avg = scored.length
    ? Math.round((scored.reduce((a, v) => a + v.score!.correct / v.score!.total, 0) / scored.length) * 100)
    : 0;
  const mastered = notes.filter((n) => n.mastered).length;

  return (
    <Shell>
      <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-sm uppercase tracking-widest">Side A · Your sessions</p>
          <h1 className="text-5xl font-black">The Vault</h1>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Create New Vault
        </button>
      </section>

      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Library, label: "Vaults", value: vaults.length },
          { icon: Target, label: "Avg. quiz score", value: `${avg}%` },
          { icon: BookCheck, label: "Mastered corrections", value: `${mastered}/${notes.length}` },
        ].map((s) => (
          <div key={s.label} className="panel flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary p-3 text-primary-foreground"><s.icon className="h-5 w-5" /></div>
            <div>
              <div className="font-display text-3xl font-black">{s.value}</div>
              <div className="font-mono text-xs uppercase">{s.label}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vaults.map((v) => (
          <Link key={v.id} to="/vault/$id" params={{ id: v.id }} className="panel group block p-5 transition hover:-translate-y-1">
            <div className="mb-3 flex items-center justify-between">
              <span className="badge">{v.topic || "General"}</span>
              {v.score ? (
                <span className="badge bg-primary text-primary-foreground"><Award className="h-3 w-3" />{v.score.correct}/{v.score.total}</span>
              ) : (
                <span className="badge opacity-70">No quiz yet</span>
              )}
            </div>
            <h2 className="text-2xl font-bold leading-tight">{v.title}</h2>
            <div className="mt-4 space-y-1 font-mono text-sm">
              <div className="flex items-center gap-2"><Mic2 className="h-4 w-4" />{v.speaker}</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{v.date}</div>
            </div>
          </Link>
        ))}
      </section>

      {open && <CreateModal onClose={() => setOpen(false)} />}
    </Shell>
  );
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const nav = useNavigate();
  const [f, setF] = useState({ title: "", speaker: "", topic: "", date: new Date().toISOString().slice(0, 10) });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 animate-in fade-in" onClick={onClose}>
      <form
        className="panel w-full max-w-md space-y-3 bg-background p-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          const id = actions.createVault(f);
          nav({ to: "/vault/$id", params: { id } });
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black">New Vault</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        {(["title", "speaker", "topic"] as const).map((k) => (
          <label key={k} className="block font-mono text-xs uppercase">
            {k}
            <input required={k !== "topic"} className="field mt-1 font-sans text-base normal-case" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </label>
        ))}
        <label className="block font-mono text-xs uppercase">
          Session date
          <input type="date" className="field mt-1" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </label>
        <button className="btn-primary w-full">Press it to vinyl</button>
      </form>
    </div>
  );
}
