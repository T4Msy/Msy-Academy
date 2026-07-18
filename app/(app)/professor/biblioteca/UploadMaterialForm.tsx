"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadMaterialFile } from "./actions";

export function UploadMaterialForm({ classes }: { classes: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFile(f: File | null) {
    if (f && f.type !== "application/pdf") {
      setError("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (f && f.size > 10 * 1024 * 1024) {
      setError("O arquivo deve ter no máximo 10MB.");
      return;
    }
    setError(null);
    setFile(f);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("title", title);
    formData.set("classId", classId);
    startTransition(async () => {
      try {
        await uploadMaterialFile(formData);
        setOpen(false);
        setFile(null);
        setTitle("");
        setClassId("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não conseguimos enviar o material. Tente novamente.");
      }
    });
  }

  if (!open) {
    return (
      <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-4 py-2.5" onClick={() => setOpen(true)}>
        Enviar arquivo
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-[420px] overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-col p-5.5 gap-2.5">
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="material-title">Título (opcional)</label>
          <input className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="material-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Padrão: nome do arquivo" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground">Arquivo PDF (até 10MB)</label>
          <div className="dropzone" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}>
            <div className="dz-text">
              <span className="dz-title">{file ? file.name : "Clique para selecionar um PDF"}</span>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="application/pdf" className="visually-hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="material-class">Turma (opcional)</label>
          <select className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="material-class" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Nenhuma — só Biblioteca</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            Anexar a uma turma torna o conteúdo disponível para o Tutor IA dos alunos matriculados.
          </p>
        </div>
        {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={() => setOpen(false)}>Cancelar</button>
          <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm" disabled={pending || !file}>
            {pending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </form>
  );
}
