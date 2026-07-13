import type { Metadata } from "next";
import { listPlans } from "@/lib/billing/plans";
import { PlanEditForm } from "@/components/admin/PlanEditForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Planos — Admin" };

export default async function AdminPlanosPage() {
  const plans = await listPlans();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Planos</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Cota de IA, preço e Stripe Price ID de cada plano (RF-AD07).</p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
        {plans.map((plan) => (
          <section key={plan.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">{plan.name}</h2>
              </div>
            </div>
            <div className="flex flex-col gap-4.5 p-5.5">
              <PlanEditForm plan={plan} />
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
