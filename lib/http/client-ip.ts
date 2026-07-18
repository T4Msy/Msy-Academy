/**
 * Extrai o IP do cliente para chaveamento de rate limit por IP (auth —
 * login/signup/recuperação de senha, que não têm usuário autenticado para
 * chavear por user id). Nenhum lugar do repo lia estes headers antes disto.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Sem proxy na frente (dev local) — mesmo bucket para todo mundo, não é um
  // problema de segurança fora de produção.
  return "unknown";
}
