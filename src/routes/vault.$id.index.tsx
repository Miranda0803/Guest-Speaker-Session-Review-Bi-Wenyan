import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Upload, Sparkles, FileText, Trash2, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/Shell";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/vault/$id/")({
  head: () => ({
    meta: [
      { title: "Vault Workspace — Vibe Vault" },
      { name: "description", content: "Upload slides, write your summary and generate a quiz." },
      { property: "og:title", content: "Vault Workspace — Vibe Vault" },
      { property: "og:description", content: "Upload slides, write your summary and generate a quiz." },
    ],
  }),
  component: Workspace,
});

function Workspace() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const vault = useStore().vaults.find((v) => v.id === id);
  const [text, setText] = useState(vault?.summary ?? "");
  const [saved, setSaved] = useState(true);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (vault) setText(vault.summary); }, [vault?.id]);
  useEffect(() => {
    if (!vault || text === vault.summary) return;
    setSaved(false);
    const t = setTimeout(() => { actions.updateVault(id, { summary: text }); setSaved(true); }, 800);
    return () => clearTimeout(t);
  }, [text]);

  if (!vault) return <Shell><p>Vault not found. <Link to="/" className="underline">Back</Link></p></Shell>;
  const file = vault.files[active];

  const onFiles = async (list: FileList | null) => {
    if (!list) return;
    const added = await Promise.all(
      Array.from(list).map(
        (f) =>
          new Promise<{ id: string; name: string; type: string; url: string }>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve({ id: crypto.randomUUID(), name: f.name, type: f.type, url: String(r.result) });
            r.readAsDataURL(f);
          }),
      ),
    );
    actions.updateVault(id, { files: [...vault.files, ...added] });
  };

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="mb-1 inline-flex items-center gap-1 font-mono text-sm"><ArrowLeft className="h-4 w-4" />All vaults</Link>
          <h1 className="text-4xl font-black">{vault.title}</h1>
          <p className="font-mono text-sm">{vault.speaker} · {vault.date}</p>
        </div>
        <button className="btn-ghost" onClick={() => { actions.deleteVault(id); nav({ to: "/" }); }}>
          <Trash2 className="h-4 w-4" />Delete
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel flex flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">Slide Deck</h2>
            <button className="btn-ghost" onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4" />Upload</button>
            <input ref={inputRef} type="file" hidden multiple accept="application/pdf,image/*" onChange={(e) => onFiles(e.target.files)} />
          </div>
          <div
            className="flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-accent bg-secondary"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            {!file ? (
              <div className="p-6 text-center font-mono text-sm"><Upload className="mx-auto mb-2 h-8 w-8" />Drop PDF or image slides here</div>
            ) : file.type.startsWith("image/") ? (
              <img src={file.url} alt={file.name} className="max-h-[520px] object-contain" />
            ) : (
              <iframe src={file.url} title={file.name} className="h-[520px] w-full" />
            )}
          </div>
          {vault.files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {vault.files.map((f, i) => (
                <button key={f.id} onClick={() => setActive(i)} className={`badge ${i === active ? "bg-primary text-primary-foreground" : ""}`}>
                  <FileText className="h-3 w-3" />{f.name}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="panel flex flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">Summary Notes</h2>
            <span className="badge">{saved ? <><Check className="h-3 w-3" />Saved</> : "Saving…"}</span>
          </div>
          <textarea
            className="field min-h-[420px] flex-1 resize-none font-mono text-sm leading-relaxed"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="# Key takeaways&#10;&#10;Write full sentences — your quiz is built from them."
          />
          <button
            className="btn-primary mt-4 py-3 text-base"
            disabled={text.replace(/^#.*$/gm, "").trim().length < 40}
            onClick={() => { actions.updateVault(id, { summary: text }); nav({ to: "/vault/$id/quiz", params: { id } }); }}
          >
            <Sparkles className="h-5 w-5" />Generate Quiz
          </button>
        </section>
      </div>
    </Shell>
  );
}
