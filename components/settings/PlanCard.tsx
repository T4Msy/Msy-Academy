import { createClient } from "@/lib/supabase/server";
import { getSubscriptionForTenant, listPlans } from "@/lib/billing/plans";
import { PlanUpgradeButtons } from "./PlanUpgradeButtons";

const STATUS_LABEL: Record<string, string> = {
  TRIALING: "Em teste",
  ACTIVE: "Ativa",
  PAST_DUE: "Pagamento pendente",
  CANCELED: "Cancelada",
};

function formatPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + "/mês";
}

export async function PlanCard({ returnPath }: { returnPath: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user!.id).single();
  if (!profile) return null;

  const [subscription, allPlans] = await Promise.all([
    getSubscriptionForTenant(profile.tenant_id),
    listPlans(),
  ]);

  const currentCode = subscription?.plan.code ?? "FREE";
  const upgradeOptions = allPlans
    .filter((p) => p.code !== currentCode && p.price_cents > 0)
    .map((p) => ({ code: p.code, name: p.name }));

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Plano</h2>
        </div>
      </div>
      <div className="flex flex-col gap-4.5 p-5.5">
        <p className="mt-0 text-xs leading-snug text-muted-foreground">
          {subscription?.plan.name ?? "Gratuito"} · {formatPrice(subscription?.plan.price_cents ?? 0)}
          {subscription && subscription.status !== "ACTIVE" && ` · ${STATUS_LABEL[subscription.status] ?? subscription.status}`}
        </p>
        <PlanUpgradeButtons
          upgradeOptions={upgradeOptions}
          hasStripeCustomer={Boolean(subscription?.stripe_customer_id)}
          returnPath={returnPath}
        />
      </div>
    </section>
  );
}
