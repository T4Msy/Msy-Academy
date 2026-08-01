"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadMaterialFile } from "@/app/(app)/professor/biblioteca/actions";
import { Button } from "@/components/ui/button";

/** Upload de material já vinculado à turma — mesma Server Action da Biblioteca, sem o seletor de turma. */
export function UploadMaterialForm({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
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

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
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
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não conseguimos enviar o material. Tente novamente.");
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        Enviar arquivo
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-[420px] overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-col gap-2.5 p-5.5">
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="class-material-title">Título (opcional)</label>
          <input
            className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
            id="class-material-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Padrão: nome do arquivo"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground">Arquivo PDF (até 10MB)</label>
          <div
            className="dropzone"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <div className="dz-text">
              <span className="dz-title">{file ? file.name : "Clique para selecionar um PDF"}</span>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="application/pdf" className="visually-hidden" onChange={(event) => handleFile(event.target.files?.[0] ?? null)} />
        </div>
        <p className="text-xs leading-snug text-muted-foreground">
          O material fica disponível para o Tutor IA e para os alunos matriculados nesta turma.
        </p>
        {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="submit" size="sm" disabled={pending || !file}>{pending ? "Enviando…" : "Enviar"}</Button>
        </div>
      </div>
    </form>
  );
}
