"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { joinClass } from "./actions";

export function JoinClassCard({ inviteCode }: { inviteCode: string }) {
  const [state, setState] = useState<{ status: "pending" | "ok" | "error"; className?: string; error?: string }>({
    status: "pending",
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const { className } = await joinClass(inviteCode);
        setState({ status: "ok", className });
      } catch (err) {
        setState({ status: "error", error: err instanceof Error ? err.message : "Algo deu errado." });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  if (state.status === "pending") {
    return (
      <div className="auth-wrap">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <span className="btn-loader" style={{ margin: "0 auto" }} />
          <p className="field-hint">Entrando na turma…</p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="notice notice--error">{state.error}</div>
          <p className="auth-foot">
            <Link href="/aluno">Ir para o início</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Você entrou em {state.className}!</div>
        <p className="auth-subtitle">A turma já aparece no seu ambiente de aluno.</p>
        <Link href="/aluno" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
