"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PlanCode } from "@/lib/billing/plans";

export function PlanSelect({
  tenantId,
  currentCode,
  plans,
  onChangePlan,
}: {
  tenantId: string;
  currentCode: PlanCode;
  plans: { code: PlanCode; name: string }[];
  onChangePlan: (tenantId: string, planCode: PlanCode) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value as PlanCode;
    startTransition(async () => {
      await onChangePlan(tenantId, code);
      router.refresh();
    });
  }

  return (
    <select className="input" value={currentCode} onChange={onChange} disabled={pending} aria-label="Plano do tenant">
      {plans.map((p) => (
        <option key={p.code} value={p.code}>{p.name}</option>
      ))}
    </select>
  );
}
