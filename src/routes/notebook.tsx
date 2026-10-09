import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, X, Check } from "lucide-react";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/notebook")({
  head: () => ({
    meta: [
      { title: "Correction Notebook — Vibe Vault" },
      { name: "description", content: "Review every missed quiz answer with explanations." },
      { property: "og:title", content: "Correction Notebook — Vibe Vault" },
      { property: "og:description", content: "Review every missed quiz answer with explanations." },
    ],
  }),
  component: Notebook,
});

function Notebook() {
  const { notes, vaults } = useStore();
  const [filter, setFilter] = useState<"open" | "all" | "mastered">("open");
  const list = notes.filter((n) => filter === "all" || (filter === "mastered" ? n.mastered : !n.mastered));

  return (
    <Shell>
      <p className="font-mono text-sm uppercase tracking-widest">Side B · Liner notes</p>
      <h1 className="mb-6 text-5xl font-black">Correction Notebook</h1>
      <div className="mb-6 flex gap-2">
        {(["open", "mastered", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{f}</button>
        ))}
      </div>
      {list.length === 0 && <div className="panel p-8 text-center font-mono">Nothing here — keep spinning those quizzes.</div>}
      <div className="grid gap-4">
        {list.map((n) => {
          const v = vaults.find((x) => x.id === n.vaultId);
          return (
            <article key={n.id} className={`panel p-5 transition ${n.mastered ? "opacity-60" : ""}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                {v ? <Link to="/vault/$id" params={{ id: v.id }} className="badge">{v.title}</Link> : <span className="badge">Deleted vault</span>}
                <button className="btn-ghost" onClick={() => actions.toggleMastered(n.id)}>
                  {n.mastered ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  {n.mastered ? "Mastered" : "Mark as Mastered"}
                </button>
              </div>
              <h2 className="mb-3 text-xl font-bold">{n.question}</h2>
              <div className="grid gap-2 font-mono text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-secondary p-3"><X className="mr-1 inline h-4 w-4 text-destructive" />You: {n.userAnswer}</div>
                <div className="rounded-xl bg-secondary p-3"><Check className="mr-1 inline h-4 w-4 text-success" />Correct: {n.correctAnswer}</div>
              </div>
              <p className="mt-3 text-sm">{n.explanation}</p>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}
