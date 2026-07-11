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
    <section className="card" style={{ maxWidth: 480, marginTop: 16 }}>
      <div className="card-header">
        <div className="card-title-group">
          <h2 className="card-title">Plano</h2>
        </div>
      </div>
      <div className="card-body">
        <p className="field-hint" style={{ marginTop: 0 }}>
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
