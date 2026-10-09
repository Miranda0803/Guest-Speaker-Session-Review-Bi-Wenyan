import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, RotateCcw, NotebookPen } from "lucide-react";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { actions, generateQuiz, useStore, type Question } from "@/lib/store";

export const Route = createFileRoute("/vault/$id/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz Station — Vibe Vault" },
      { name: "description", content: "Test your recall of a talk with a quick quiz." },
      { property: "og:title", content: "Quiz Station — Vibe Vault" },
      { property: "og:description", content: "Test your recall of a talk with a quick quiz." },
    ],
  }),
  component: Quiz,
});

const norm = (s: string) => s.trim().toLowerCase().replace(/[^\w-]/g, "");

function Quiz() {
  const { id } = Route.useParams();
  const vault = useStore().vaults.find((v) => v.id === id);
  const [qs, setQs] = useState<Question[]>([]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const start = () => { if (vault) { setQs(generateQuiz(vault)); setI(0); setAnswers([]); setDone(false); } };
  useEffect(start, [vault?.id]);

  if (!vault) return <Shell><p>Vault not found.</p></Shell>;
  if (!qs.length) return <Shell><p className="font-mono">Add more summary sentences to generate a quiz.</p></Shell>;

  const q = qs[i]!;
  const finish = () => {
    const wrong = qs.map((q, k) => ({ q, a: answers[k] ?? "" })).filter(({ q, a }) => norm(q.answer) !== norm(a));
    actions.updateVault(id, { score: { correct: qs.length - wrong.length, total: qs.length } });
    actions.addNotes(wrong.map(({ q, a }) => ({ vaultId: id, question: q.prompt, userAnswer: a || "(blank)", correctAnswer: q.answer, explanation: q.explanation })));
    setDone(true);
  };

  if (done) {
    const correct = qs.filter((q, k) => norm(q.answer) === norm(answers[k] ?? "")).length;
    return (
      <Shell>
        <div className="panel mx-auto max-w-lg p-8 text-center animate-in zoom-in-95">
          <p className="font-mono text-sm uppercase">Final score</p>
          <div className="font-display text-7xl font-black">{correct}/{qs.length}</div>
          <p className="mt-2">{qs.length - correct} incorrect answers synced to your notebook.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button className="btn-ghost" onClick={start}><RotateCcw className="h-4 w-4" />Retry</button>
            <Link to="/notebook" className="btn-primary"><NotebookPen className="h-4 w-4" />Notebook</Link>
          </div>
        </div>
      </Shell>
    );
  }

  const setA = (v: string) => { const n = [...answers]; n[i] = v; setAnswers(n); };
  return (
    <Shell>
      <Link to="/vault/$id" params={{ id }} className="mb-4 inline-flex items-center gap-1 font-mono text-sm"><ArrowLeft className="h-4 w-4" />{vault.title}</Link>
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex justify-between font-mono text-sm">
          <span>Track {i + 1} of {qs.length}</span>
          <span>{q.kind === "mc" ? "Multiple choice" : "Short answer"}</span>
        </div>
        <div className="mb-5 h-3 overflow-hidden rounded-full border-2 border-accent bg-secondary">
          <div className="h-full bg-primary transition-all" style={{ width: `${((i + 1) / qs.length) * 100}%` }} />
        </div>
        <div key={i} className="panel p-6 animate-in fade-in slide-in-from-right-4">
          <h2 className="mb-5 text-2xl font-bold leading-snug">{q.prompt}</h2>
          {q.kind === "mc" ? (
            <div className="grid gap-2">
              {q.options.map((o) => (
                <button key={o} onClick={() => setA(o)} className={`btn justify-start ${answers[i] === o ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{o}</button>
              ))}
            </div>
          ) : (
            <input className="field" placeholder="Type the missing word…" value={answers[i] ?? ""} onChange={(e) => setA(e.target.value)} />
          )}
          <div className="mt-6 flex justify-between">
            <button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}><ArrowLeft className="h-4 w-4" />Back</button>
            {i < qs.length - 1 ? (
              <button className="btn-primary" onClick={() => setI(i + 1)}>Next<ArrowRight className="h-4 w-4" /></button>
            ) : (
              <button className="btn-primary" onClick={finish}>Submit quiz</button>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
