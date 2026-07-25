"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { gradeByAnswerKey } from "../actions";

export function GabaritoCorrection({ submissionId, questionCount }: { submissionId: string; questionCount: number }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function correct() {
    setError(null);
    startTransition(async () => {
      try {
        await gradeByAnswerKey(submissionId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível corrigir esta entrega.");
      }
    });
  }

  return <section className="rounded-lg border border-brand-border bg-brand-dim p-5 shadow-elevated"><h2 className="font-display text-lg font-bold text-foreground">Corrigir questões objetivas</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Há {questionCount} questão(ões) objetiva(s) aguardando a aplicação do gabarito. A nota só será enviada ao aluno depois da sua confirmação final.</p>{error && <p role="alert" className="mt-3 text-sm text-danger-text">{error}</p>}<button type="button" onClick={correct} disabled={pending} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">{pending ? "Corrigindo…" : "Corrigir pelo gabarito"}</button></section>;
}
