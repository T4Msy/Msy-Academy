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
      <div className="button-row">
        {upgradeOptions.map((p) => (
          <button key={p.code} type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={() => upgrade(p.code)}>
            Fazer upgrade para {p.name}
          </button>
        ))}
        {hasStripeCustomer && (
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={manage}>
            Gerenciar assinatura
          </button>
        )}
      </div>
      {error && <div className="notice notice--error mt-sm">{error}</div>}
    </div>
  );
}
