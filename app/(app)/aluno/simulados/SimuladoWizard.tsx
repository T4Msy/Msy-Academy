"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSimulado } from "./actions";

export function SimuladoWizard({ subjects }: { subjects: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [quantidade, setQuantidade] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const mode = subjectId ? "MATERIA" : difficulty ? "DIFICULDADE" : "PERSONALIZADO";
        const id = await createSimulado({
          title: `Simulado ${new Date().toLocaleDateString("pt-BR")}`,
          mode,
          quantidade: Number(quantidade) || 5,
          subjectId: subjectId || null,
          difficulty: (difficulty || null) as "FACIL" | "MEDIO" | "DIFICIL" | null,
        });
        router.push(`/aluno/simulados/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não conseguimos criar o simulado. Tente novamente.");
      }
    });
  }

  if (!open) {
    return (
      <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5" onClick={() => setOpen(true)}>
        Gerar simulado
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors max-w-[420px]">
      <div className="flex flex-col p-5.5 gap-2.5">
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="subject">Matéria (opcional)</label>
          <Select value={subjectId || "all"} onValueChange={(value) => setSubjectId(value === "all" ? "" : value)}>
            <SelectTrigger id="subject" className="w-full bg-card text-md text-foreground">
              <SelectValue aria-label={subjectId ? subjects.find((s) => s.id === subjectId)?.name : "Todas"} />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover text-popover-foreground shadow-elevated">
              <SelectItem value="all">Todas</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="difficulty">Dificuldade (opcional)</label>
          <Select value={difficulty || "all"} onValueChange={(value) => setDifficulty(value === "all" ? "" : value)}>
            <SelectTrigger id="difficulty" className="w-full bg-card text-md text-foreground">
              <SelectValue aria-label={difficulty || "Todas"} />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover text-popover-foreground shadow-elevated">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="FACIL">Fácil</SelectItem>
              <SelectItem value="MEDIO">Médio</SelectItem>
              <SelectItem value="DIFICIL">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="block text-sm font-semibold text-foreground" htmlFor="quantidade">Quantidade de questões</label>
          <input className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow" id="quantidade" type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        </div>
        <p className="mt-0 text-xs leading-snug text-muted-foreground">
          As questões vêm das provas e atividades já atribuídas a você.
        </p>
        {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={() => setOpen(false)}>Cancelar</button>
          <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm" disabled={pending}>
            {pending ? "Gerando…" : "Gerar"}
          </button>
        </div>
      </div>
    </form>
  );
}
