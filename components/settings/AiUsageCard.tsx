import { createClient } from "@/lib/supabase/server";

// Illustrative default until billing/plans exist (RF-G05) — not enforced,
// just gives the user a sense of consumption ahead of quota/upsell later.
const DEFAULT_MONTHLY_TOKEN_LIMIT = 200_000;

export async function AiUsageCard() {
  const supabase = await createClient();
  const period = new Date().toISOString().slice(0, 7);

  const { data: usage } = await supabase
    .from("ai_usage")
    .select("tokens_used, requests_count")
    .eq("period", period)
    .maybeSingle();

  const tokensUsed = usage?.tokens_used ?? 0;
  const requestsCount = usage?.requests_count ?? 0;
  const pct = Math.min(100, Math.round((tokensUsed / DEFAULT_MONTHLY_TOKEN_LIMIT) * 100));
  const nearLimit = pct >= 80;

  return (
    <section className="card" style={{ maxWidth: 480, marginTop: 16 }}>
      <div className="card-header">
        <div className="card-title-group">
          <h2 className="card-title">Uso de IA este mês</h2>
        </div>
      </div>
      <div className="card-body">
        <p className="field-hint" style={{ marginTop: 0 }}>
          {requestsCount} chamada{requestsCount !== 1 ? "s" : ""} de IA · {tokensUsed.toLocaleString("pt-BR")} de{" "}
          {DEFAULT_MONTHLY_TOKEN_LIMIT.toLocaleString("pt-BR")} tokens estimados
        </p>
        <div className="usage-bar">
          <div className={`usage-bar-fill${nearLimit ? " usage-bar-fill--warn" : ""}`} style={{ width: `${pct}%` }} />
        </div>
        {nearLimit && (
          <p className="field-hint" style={{ color: "var(--danger)" }}>
            Você está perto do limite estimado do plano gratuito.
          </p>
        )}
      </div>
    </section>
  );
}
