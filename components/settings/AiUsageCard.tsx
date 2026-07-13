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
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Uso de IA este mês</h2>
        </div>
      </div>
      <div className="flex flex-col gap-4.5 p-5.5">
        <p className="mt-0 text-xs leading-snug text-muted-foreground">
          {requestsCount} chamada{requestsCount !== 1 ? "s" : ""} de IA · {tokensUsed.toLocaleString("pt-BR")} de{" "}
          {monthlyLimit.toLocaleString("pt-BR")} tokens ({plan?.name ?? "Gratuito"})
        </p>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[rgba(var(--overlay-rgb),0.06)]">
          <div className={`h-full rounded-full transition-[width] duration-[320ms] ${nearLimit ? "bg-danger" : "bg-brand"}`} style={{ width: `${pct}%` }} />
        </div>
        {nearLimit && (
          <p className="mt-1 text-xs leading-snug text-muted-foreground text-danger-text">
            Você está perto do limite do seu plano.
          </p>
        )}
      </div>
    </section>
  );
}
