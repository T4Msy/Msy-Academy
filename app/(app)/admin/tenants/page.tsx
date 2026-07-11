import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { PlanSelect } from "@/components/admin/PlanSelect";
import { changeTenantPlan } from "./actions";
import { listPlans } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tenants — Admin" };

const TYPE_LABEL: Record<string, string> = { INDIVIDUAL: "Individual", SCHOOL: "Escola" };

export default async function AdminTenantsPage() {
  const admin = createAdminClient();

  const [{ data: tenants }, { data: classes }, { data: subs }, plans] = await Promise.all([
    admin.from("tenants").select("id, name, type, created_at").order("created_at", { ascending: false }),
    admin.from("classes").select("id, tenant_id"),
    admin.from("subscriptions").select("tenant_id, status, plan:plans(code, name)"),
    listPlans(),
  ]);

  interface SubRow {
    tenant_id: string;
    status: string;
    plan: { code: string; name: string } | { code: string; name: string }[] | null;
  }

  const classCountByTenant = new Map<string, number>();
  for (const c of (classes ?? []) as { tenant_id: string }[]) {
    classCountByTenant.set(c.tenant_id, (classCountByTenant.get(c.tenant_id) ?? 0) + 1);
  }
  const subByTenant = new Map<string, SubRow>((subs as SubRow[] | null ?? []).map((s) => [s.tenant_id, s]));

  interface TenantRow {
    id: string;
    name: string;
    type: string;
  }

  const rows = ((tenants as TenantRow[] | null) ?? []).map((t) => {
    const sub = subByTenant.get(t.id);
    const plan = Array.isArray(sub?.plan) ? sub?.plan[0] : sub?.plan;
    return {
      id: t.id,
      name: t.name,
      type: t.type,
      classCount: classCountByTenant.get(t.id) ?? 0,
      planCode: (plan?.code ?? "FREE") as import("@/lib/billing/plans").PlanCode,
      status: sub?.status ?? "ACTIVE",
    };
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">{rows.length} tenant{rows.length !== 1 ? "s" : ""}.</p>
        </div>
      </div>

      {rows.map((t) => (
        <div key={t.id} className="card" style={{ marginBottom: 12 }}>
          <div className="card-body">
            <div className="exam-meta" style={{ marginBottom: 8 }}>
              <span className="chip">{TYPE_LABEL[t.type] ?? t.type}</span>
              <span className="chip">{t.classCount} turma{t.classCount !== 1 ? "s" : ""}</span>
              <span className="chip">{t.status}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <b>{t.name}</b>
              <PlanSelect tenantId={t.id} currentCode={t.planCode} plans={plans} onChangePlan={changeTenantPlan} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
