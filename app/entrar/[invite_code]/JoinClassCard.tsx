"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { joinClass } from "./actions";

export function JoinClassCard({ inviteCode }: { inviteCode: string }) {
  const [state, setState] = useState<{ status: "loading" | "ok" | "awaiting" | "error"; className?: string; error?: string }>({
    status: "loading",
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const { className, status } = await joinClass(inviteCode);
        setState({ status: status === "PENDING" ? "awaiting" : "ok", className });
      } catch (err) {
        setState({ status: "error", error: err instanceof Error ? err.message : "Não conseguimos entrar na turma. Tente novamente." });
      }
    });
  }, [inviteCode]);

  if (state.status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center px-5 py-10">
        <div className="auth-card text-center">
          <span className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-black/20 border-t-brand-ink" />
          <p className="mt-1 text-xs leading-snug text-muted-foreground">Entrando na turma…</p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="grid min-h-screen place-items-center px-5 py-10">
        <div className="w-full max-w-[420px] rounded-lg border border-border bg-card p-7 pt-8 shadow-elevated">
          <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{state.error}</div>
          <p className="mt-4.5 text-center text-sm text-muted-foreground">
            <Link href="/aluno">Ir para o início</Link>
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "awaiting") {
    return (
      <div className="grid min-h-screen place-items-center px-5 py-10">
        <div className="w-full max-w-[420px] rounded-lg border border-border bg-card p-7 pt-8 shadow-elevated">
          <div className="font-display text-2xl font-extrabold tracking-[-0.4px] text-foreground">Solicitação enviada!</div>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {state.className} exige aprovação do professor para entrar. Você será avisado quando a solicitação for aceita.
          </p>
          <Link href="/aluno" className="btn btn-primary btn-block mt-md">
            Ir para o início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-[420px] rounded-lg border border-border bg-card p-7 pt-8 shadow-elevated">
        <div className="font-display text-2xl font-extrabold tracking-[-0.4px] text-foreground">Você entrou em {state.className}!</div>
        <p className="mt-1 text-[13.5px] text-muted-foreground">A turma já aparece no seu ambiente de aluno.</p>
        <Link href="/aluno" className="btn btn-primary btn-block mt-md">
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
