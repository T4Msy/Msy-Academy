import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { CategoricalBar } from "@/components/charts/CategoricalBar";

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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Visão geral</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Tenants, assinaturas e receita recorrente estimada.</p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
          <div className="flex flex-col gap-4.5 p-5.5">
            <p className="mt-0 text-xs leading-snug text-muted-foreground">Tenants</p>
            <div className="font-display text-[28px] font-bold">{tenantCount ?? 0}</div>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
          <div className="flex flex-col gap-4.5 p-5.5">
            <p className="mt-0 text-xs leading-snug text-muted-foreground">Assinaturas ativas</p>
            <div className="font-display text-[28px] font-bold">{activeSubs.length}</div>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
          <div className="flex flex-col gap-4.5 p-5.5">
            <p className="mt-0 text-xs leading-snug text-muted-foreground">MRR estimado</p>
            <div className="font-display text-[28px] font-bold">
              {(mrrCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>
        </div>
      </div>

      {byPlan.size > 0 && (
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors mt-4 max-w-[480px]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Assinaturas por plano</h2>
            </div>
          </div>
          <div className="flex flex-col gap-4.5 p-5.5">
            <CategoricalBar
              items={[...byPlan.entries()].map(([label, value], i) => ({ label, value, catSlot: (i % 8) + 1 }))}
            />
          </div>
        </section>
      )}
    </>
  );
}
