import { useSyncExternalStore } from "react";

export type VaultFile = { id: string; name: string; url: string; type: string };
export type Vault = {
  id: string;
  title: string;
  speaker: string;
  topic: string;
  date: string;
  summary: string;
  files: VaultFile[];
  score?: { correct: number; total: number };
};
export type Note = {
  id: string;
  vaultId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  mastered: boolean;
};
type State = { vaults: Vault[]; notes: Note[] };

const seed: State = {
  vaults: [
    {
      id: "v1",
      title: "Designing for Slowness",
      speaker: "Maren Holt",
      topic: "Product Design",
      date: "2026-09-12",
      summary:
        "# Designing for Slowness\n\nFriction can be a feature when it creates reflection. Onboarding should reveal value before asking for commitment. Calm technology lives in the periphery of attention. Defaults shape the behaviour of most users. Delight comes from consistency rather than novelty.",
      files: [],
      score: { correct: 5, total: 6 },
    },
    {
      id: "v2",
      title: "The Analog Revival",
      speaker: "Theo Abara",
      topic: "Music Industry",
      date: "2026-08-03",
      summary:
        "# The Analog Revival\n\nVinyl sales grew for seventeen consecutive years. Collectors value ownership over access. Independent pressing plants face capacity bottlenecks. Physical media builds deeper fan loyalty.",
      files: [],
    },
  ],
  notes: [
    {
      id: "n1",
      vaultId: "v1",
      question: "According to the talk, delight comes from ____ rather than novelty.",
      userAnswer: "surprise",
      correctAnswer: "consistency",
      explanation: "The speaker argued that predictable, consistent experiences build trust, which users perceive as delight.",
      mastered: false,
    },
  ],
};

const KEY = "vibe-vault-v1";
let state: State = seed;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
  } catch {}
}
function set(fn: (s: State) => State) {
  state = fn(state);
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...state, vaults: state.vaults.map((v) => ({ ...v, files: v.files.filter((f) => !f.url.startsWith("blob:")) })) }),
    );
  } catch {}
  listeners.forEach((l) => l());
}

export function useStore() {
  return useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      queueMicrotask(l);
      return () => listeners.delete(l);
    },
    () => (load(), state),
    () => seed,
  );
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const actions = {
  createVault(v: Pick<Vault, "title" | "speaker" | "topic" | "date">) {
    const id = uid();
    set((s) => ({ ...s, vaults: [{ ...v, id, summary: `# ${v.title}\n\n`, files: [] }, ...s.vaults] }));
    return id;
  },
  updateVault(id: string, patch: Partial<Vault>) {
    set((s) => ({ ...s, vaults: s.vaults.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
  },
  deleteVault(id: string) {
    set((s) => ({ vaults: s.vaults.filter((v) => v.id !== id), notes: s.notes.filter((n) => n.vaultId !== id) }));
  },
  addNotes(notes: Omit<Note, "id" | "mastered">[]) {
    set((s) => ({ ...s, notes: [...notes.map((n) => ({ ...n, id: uid(), mastered: false })), ...s.notes] }));
  },
  toggleMastered(id: string) {
    set((s) => ({ ...s, notes: s.notes.map((n) => (n.id === id ? { ...n, mastered: !n.mastered } : n)) }));
  },
};

export type Question =
  | { kind: "mc"; prompt: string; options: string[]; answer: string; explanation: string }
  | { kind: "short"; prompt: string; answer: string; explanation: string };

/** Mock quiz generator — builds questions from the summary notes. */
export function generateQuiz(v: Vault): Question[] {
  const sentences = v.summary
    .replace(/^#.*$/gm, "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(" ").length >= 4);
  const keyword = (s: string) =>
    s.replace(/[^\w\s-]/g, "").split(/\s+/).sort((a, b) => b.length - a.length)[0] ?? "";
  const pool = sentences.map(keyword);
  const qs: Question[] = sentences.slice(0, 8).map((s, i) => {
    const k = keyword(s);
    const prompt = s.replace(new RegExp(`\\b${k}\\b`), "____");
    const explanation = `From ${v.speaker}'s notes: "${s}"`;
    if (i % 2 === 0) {
      const distract = [...new Set(pool.filter((w) => w !== k).concat(["rhythm", "texture", "momentum"]))].slice(0, 3);
      const options = [k, ...distract].sort(() => Math.random() - 0.5);
      return { kind: "mc", prompt, options, answer: k, explanation };
    }
    return { kind: "short", prompt, answer: k, explanation };
  });
  return qs;
}
