import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const admin = createAdminClient();

  const [{ count: tenantCount }, { data: subs }] = await Promise.all([
    admin.from("tenants").select("id", { count: "exact", head: true }),
    admin.from("subscriptions").select("status, plan:plans(name, price_cents)"),
  ]);

  const activeSubs = (subs ?? []).filter((s: { status: string }) => s.status === "ACTIVE");
  const mrrCents = activeSubs.reduce(
    (sum: number, s: { plan: { price_cents: number } | { price_cents: number }[] }) => {
      const plan = Array.isArray(s.plan) ? s.plan[0] : s.plan;
      return sum + (plan?.price_cents ?? 0);
    },
    0,
  );

  const byPlan = new Map<string, number>();
  for (const s of activeSubs) {
    const plan = Array.isArray(s.plan) ? s.plan[0] : s.plan;
    const name = plan?.name ?? "?";
    byPlan.set(name, (byPlan.get(name) ?? 0) + 1);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Visão geral</h1>
          <p className="page-subtitle">Tenants, assinaturas e receita recorrente estimada.</p>
        </div>
      </div>

      <div className="quick-actions-grid">
        <div className="card">
          <div className="card-body">
            <p className="field-hint" style={{ marginTop: 0 }}>Tenants</p>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{tenantCount ?? 0}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="field-hint" style={{ marginTop: 0 }}>Assinaturas ativas</p>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{activeSubs.length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="field-hint" style={{ marginTop: 0 }}>MRR estimado</p>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {(mrrCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>
        </div>
      </div>

      {byPlan.size > 0 && (
        <section className="card" style={{ maxWidth: 480, marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title-group">
              <h2 className="card-title">Assinaturas por plano</h2>
            </div>
          </div>
          <div className="card-body">
            {[...byPlan.entries()].map(([name, count]) => (
              <p key={name} className="field-hint" style={{ margin: "4px 0" }}>
                {name}: {count}
              </p>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
