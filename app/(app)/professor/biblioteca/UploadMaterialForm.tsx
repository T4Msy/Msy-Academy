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
        setError(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
        Enviar arquivo
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-420">
      <div className="card-body card-body--form">
        <div className="form-field">
          <label className="field-label" htmlFor="material-title">Título (opcional)</label>
          <input className="input" id="material-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Padrão: nome do arquivo" />
        </div>
        <div className="form-field">
          <label className="field-label">Arquivo PDF (até 10MB)</label>
          <div className="dropzone" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}>
            <div className="dz-text">
              <span className="dz-title">{file ? file.name : "Clique para selecionar um PDF"}</span>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="application/pdf" className="visually-hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="material-class">Turma (opcional)</label>
          <select className="input" id="material-class" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Nenhuma — só Biblioteca</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="field-hint">
            Anexar a uma turma torna o conteúdo disponível para o Tutor IA dos alunos matriculados.
          </p>
        </div>
        {error && <div className="notice notice--error">{error}</div>}
        <div className="popover-row">
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setOpen(false)}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending || !file}>
            {pending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </form>
  );
}
