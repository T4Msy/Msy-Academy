"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession, createPortalSession } from "@/lib/billing/actions";
import type { PlanCode } from "@/lib/billing/plans";

export function PlanUpgradeButtons({
  upgradeOptions,
  hasStripeCustomer,
  returnPath,
}: {
  upgradeOptions: { code: PlanCode; name: string }[];
  hasStripeCustomer: boolean;
  returnPath: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function upgrade(code: PlanCode) {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession(code, returnPath);
      if (result?.error) setError(result.error);
    });
  }

  function manage() {
    setError(null);
    startTransition(async () => {
      const result = await createPortalSession(returnPath);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {upgradeOptions.map((p) => (
          <button key={p.code} type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm" disabled={pending} onClick={() => upgrade(p.code)}>
            Fazer upgrade para {p.name}
          </button>
        ))}
        {hasStripeCustomer && (
          <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm" disabled={pending} onClick={manage}>
            Gerenciar assinatura
          </button>
        )}
      </div>
      {error && <div className="notice notice--error mt-sm">{error}</div>}
    </div>
  );
}
