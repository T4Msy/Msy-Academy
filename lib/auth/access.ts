export type AppRole = "ADMIN" | "PROFESSOR" | "ALUNO";

const UNSAFE_POST_AUTH_PATHS = [
  "/login",
  "/cadastro",
  "/onboarding",
  "/consentimento-conta",
  "/acesso-indisponivel",
];

export function homeForRoles(roles: readonly string[]): string | null {
  if (roles.includes("ADMIN")) return "/admin";
  if (roles.includes("PROFESSOR")) return "/professor";
  if (roles.includes("ALUNO")) return "/aluno";
  return null;
}

export function safePostAuthRedirect(target: string | null | undefined): string | null {
  if (!target || !target.startsWith("/") || target.startsWith("//")) return null;

  const pathname = target.split(/[?#]/, 1)[0];
  if (UNSAFE_POST_AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  return target;
}
