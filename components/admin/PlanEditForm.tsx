"use client";

import { useState, useTransition } from "react";
import { updatePlan } from "@/app/(app)/admin/planos/actions";
import type { Plan } from "@/lib/billing/plans";

export function PlanEditForm({ plan }: { plan: Plan }) {
  const [quota, setQuota] = useState(String(plan.ai_quota_monthly));
  const [priceCents, setPriceCents] = useState(String(plan.price_cents));
  const [priceId, setPriceId] = useState(plan.stripe_price_id ?? "");
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    startTransition(async () => {
      try {
        await updatePlan(plan.id, {
          ai_quota_monthly: Number(quota),
          price_cents: Number(priceCents),
          stripe_price_id: priceId,
        });
        setNotice({ type: "ok", text: "Plano salvo." });
      } catch (err) {
        setNotice({ type: "error", text: err instanceof Error ? err.message : "Algo deu errado." });
      }
    });
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={onSubmit} data-testid={`plan-edit-form-${plan.id}`}>
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-foreground" htmlFor={`quota-${plan.id}`}>Cota de IA mensal (tokens)</label>
        <input
          className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
          data-testid={`plan-quota-${plan.id}`}
          id={`quota-${plan.id}`}
          type="number"
          min={0}
          value={quota}
          onChange={(e) => setQuota(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-foreground" htmlFor={`price-${plan.id}`}>Preço (centavos/mês)</label>
        <input
          className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
          data-testid={`plan-price-${plan.id}`}
          id={`price-${plan.id}`}
          type="number"
          min={0}
          value={priceCents}
          onChange={(e) => setPriceCents(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-semibold text-foreground" htmlFor={`price-id-${plan.id}`}>Stripe Price ID</label>
        <input
          className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
          data-testid={`plan-price-id-${plan.id}`}
          id={`price-id-${plan.id}`}
          value={priceId}
          onChange={(e) => setPriceId(e.target.value)}
          placeholder="price_..."
        />
      </div>
      {notice && (
        <div data-testid={`plan-notice-${plan.id}`} className={`notice${notice.type === "error" ? " notice--error" : ""}`}>{notice.text}</div>
      )}
      <div>
        <button data-testid={`plan-save-${plan.id}`} type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
