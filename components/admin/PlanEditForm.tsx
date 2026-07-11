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
    <form className="form-stack" onSubmit={onSubmit}>
      <div className="form-field">
        <label className="field-label" htmlFor={`quota-${plan.id}`}>Cota de IA mensal (tokens)</label>
        <input
          className="input"
          id={`quota-${plan.id}`}
          type="number"
          min={0}
          value={quota}
          onChange={(e) => setQuota(e.target.value)}
        />
      </div>
      <div className="form-field">
        <label className="field-label" htmlFor={`price-${plan.id}`}>Preço (centavos/mês)</label>
        <input
          className="input"
          id={`price-${plan.id}`}
          type="number"
          min={0}
          value={priceCents}
          onChange={(e) => setPriceCents(e.target.value)}
        />
      </div>
      <div className="form-field">
        <label className="field-label" htmlFor={`price-id-${plan.id}`}>Stripe Price ID</label>
        <input
          className="input"
          id={`price-id-${plan.id}`}
          value={priceId}
          onChange={(e) => setPriceId(e.target.value)}
          placeholder="price_..."
        />
      </div>
      {notice && (
        <div className={`notice${notice.type === "error" ? " notice--error" : ""}`}>{notice.text}</div>
      )}
      <div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
