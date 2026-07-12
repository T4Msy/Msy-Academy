import { createClient } from "@/lib/supabase/server";
import { getActivePlanForTenant } from "@/lib/billing/plans";

export async function AiUsageCard() {
  const supabase = await createClient();
  const period = new Date().toISOString().slice(0, 7);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user!.id).single();

  const [{ data: usage }, plan] = await Promise.all([
    supabase.from("ai_usage").select("tokens_used, requests_count").eq("period", period).maybeSingle(),
    profile ? getActivePlanForTenant(profile.tenant_id) : Promise.resolve(null),
  ]);

  const monthlyLimit = plan?.ai_quota_monthly ?? 50_000;
  const tokensUsed = usage?.tokens_used ?? 0;
  const requestsCount = usage?.requests_count ?? 0;
  const pct = Math.min(100, Math.round((tokensUsed / monthlyLimit) * 100));
  const nearLimit = pct >= 80;

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2 className="card-title">Uso de IA este mês</h2>
        </div>
      </div>
      <div className="card-body">
        <p className="field-hint mt-0">
          {requestsCount} chamada{requestsCount !== 1 ? "s" : ""} de IA · {tokensUsed.toLocaleString("pt-BR")} de{" "}
          {monthlyLimit.toLocaleString("pt-BR")} tokens ({plan?.name ?? "Gratuito"})
        </p>
        <div className="usage-bar">
          <div className={`usage-bar-fill${nearLimit ? " usage-bar-fill--warn" : ""}`} style={{ width: `${pct}%` }} />
        </div>
        {nearLimit && (
          <p className="field-hint" style={{ color: "var(--danger-text)" }}>
            Você está perto do limite do seu plano.
          </p>
        )}
      </div>
    </section>
  );
}
