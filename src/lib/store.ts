import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

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

let state: State = { vaults: [], notes: [] };
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function load() {
  if (loaded) return;
  loaded = true;
  const [{ data: vaults }, { data: files }, { data: notes }] = await Promise.all([
    supabase.from("vaults").select("*").order("created_at", { ascending: false }),
    supabase.from("vault_files").select("*").order("created_at", { ascending: true }),
    supabase.from("notes").select("*").order("created_at", { ascending: false }),
  ]);
  state = {
    vaults: (vaults ?? []).map((v) => ({
      id: v.id,
      title: v.title,
      speaker: v.speaker,
      topic: v.topic,
      date: v.date,
      summary: v.summary,
      score: v.score_total ? { correct: v.score_correct ?? 0, total: v.score_total } : undefined, // eslint-disable-line
      files: (files ?? [])
        .filter((f) => f.vault_id === v.id)
        .map((f) => ({ id: f.id, name: f.name, type: f.type, url: f.data_url })),
    })),
    notes: (notes ?? []).map((n) => ({
      id: n.id,
      vaultId: n.vault_id,
      question: n.question,
      userAnswer: n.user_answer,
      correctAnswer: n.correct_answer,
      explanation: n.explanation,
      mastered: n.mastered,
    })),
  };
  emit();
}

export function useStore() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      void load();
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

export const actions = {
  async createVault(v: Pick<Vault, "title" | "speaker" | "topic" | "date">) {
    const summary = `# ${v.title}\n\n`;
    const { data } = await supabase
      .from("vaults")
      .insert({ title: v.title, speaker: v.speaker, topic: v.topic, date: v.date, summary })
      .select("id")
      .single();
    const id = data?.id ?? crypto.randomUUID();
    state = { ...state, vaults: [{ ...v, id, summary, files: [] }, ...state.vaults] };
    emit();
    return id;
  },
  async updateVault(id: string, patch: Partial<Omit<Vault, "files">>) {
    state = { ...state, vaults: state.vaults.map((v) => (v.id === id ? { ...v, ...patch } : v)) };
    emit();
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.speaker !== undefined) row.speaker = patch.speaker;
    if (patch.topic !== undefined) row.topic = patch.topic;
    if (patch.date !== undefined) row.date = patch.date;
    if (patch.summary !== undefined) row.summary = patch.summary;
    if (patch.score !== undefined) {
      row.score_correct = patch.score.correct;
      row.score_total = patch.score.total;
    }
    if (Object.keys(row).length) await supabase.from("vaults").update(row).eq("id", id);
  },
  async addFiles(vaultId: string, files: VaultFile[]) {
    state = {
      ...state,
      vaults: state.vaults.map((v) => (v.id === vaultId ? { ...v, files: [...v.files, ...files] } : v)),
    };
    emit();
    await supabase
      .from("vault_files")
      .insert(files.map((f) => ({ vault_id: vaultId, name: f.name, type: f.type, data_url: f.url })));
  },
  async deleteVault(id: string) {
    state = { vaults: state.vaults.filter((v) => v.id !== id), notes: state.notes.filter((n) => n.vaultId !== id) };
    emit();
    await supabase.from("vaults").delete().eq("id", id);
  },
  async addNotes(notes: Omit<Note, "id" | "mastered">[]) {
    const rows = notes.map((n) => ({ ...n, id: crypto.randomUUID(), mastered: false }));
    state = { ...state, notes: [...rows, ...state.notes] };
    emit();
    await supabase.from("notes").insert(
      rows.map((n) => ({
        id: n.id,
        vault_id: n.vaultId,
        question: n.question,
        user_answer: n.userAnswer,
        correct_answer: n.correctAnswer,
        explanation: n.explanation,
      })),
    );
  },
  async toggleMastered(id: string) {
    const n = state.notes.find((x) => x.id === id);
    if (!n) return;
    state = { ...state, notes: state.notes.map((x) => (x.id === id ? { ...x, mastered: !x.mastered } : x)) };
    emit();
    await supabase.from("notes").update({ mastered: !n.mastered }).eq("id", id);
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
