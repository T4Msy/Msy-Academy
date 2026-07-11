import type { Metadata } from "next";
import { listPlans } from "@/lib/billing/plans";
import { PlanEditForm } from "@/components/admin/PlanEditForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Planos — Admin" };

export default async function AdminPlanosPage() {
  const plans = await listPlans();

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Planos</h1>
          <p className="page-subtitle">Cota de IA, preço e Stripe Price ID de cada plano (RF-AD07).</p>
        </div>
      </div>

      <div className="quick-actions-grid">
        {plans.map((plan) => (
          <section key={plan.id} className="card">
            <div className="card-header">
              <div className="card-title-group">
                <h2 className="card-title">{plan.name}</h2>
              </div>
            </div>
            <div className="card-body">
              <PlanEditForm plan={plan} />
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
