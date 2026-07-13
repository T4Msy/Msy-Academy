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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Tenants</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">{rows.length} tenant{rows.length !== 1 ? "s" : ""}.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((t) => (
          <div key={t.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
            <div className="flex flex-col gap-4.5 p-5.5">
              <div className="mb-2 mt-0.5 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{TYPE_LABEL[t.type] ?? t.type}</span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{t.classCount} turma{t.classCount !== 1 ? "s" : ""}</span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{t.status}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <b>{t.name}</b>
                <PlanSelect tenantId={t.id} currentCode={t.planCode} plans={plans} onChangePlan={changeTenantPlan} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
