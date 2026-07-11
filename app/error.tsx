"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="state-wrap">
      <div className="state-card">
        <Logo size={40} />
        <div className="state-code state-code--danger">Ops</div>
        <h1 className="state-title">Algo deu errado</h1>
        <p className="state-desc">
          Não foi possível carregar esta página. Tente novamente — se persistir,
          volte para o início.
        </p>
        <div className="state-actions">
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Tentar novamente
          </button>
          <Link href="/" className="btn btn-ghost">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
