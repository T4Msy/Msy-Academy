import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, type RatelimitCategory } from "@/lib/ratelimit";
import { homeForRoles } from "@/lib/auth/access";

/**
 * Refreshes the Supabase session on every request and owns the coarse
 * routing rules for the whole app:
 *   - unauthenticated + protected route  -> /login
 *   - authenticated + hits a pure-auth page (/login, /cadastro, "/") -> into
 *     the app (onboarding if no role yet, otherwise the right environment)
 *   - authenticated + no role yet + any other protected route -> /onboarding
 *   - /termos, /privacidade and /consentimento/[token] are always
 *     reachable — unauthenticated, authenticated, onboarded or not. The
 *     first two per RNF-C07; /consentimento is visited by a guardian who
 *     has no account on the platform at all (RNF-C02), so it can never sit
 *     behind the login gate.
 * Fine-grained role/environment guards (PROFESSOR vs ALUNO) live in
 * app/(app)/professor/layout.tsx and app/(app)/aluno/layout.tsx — this layer
 * only decides "logged in or not" and "onboarded or not".
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isApi = pathname.startsWith("/api");
  const isAuthCallback = pathname.startsWith("/auth");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isRecovery = pathname === "/acesso-indisponivel";
  const isPublicAuthRoute =
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname.startsWith("/recuperar-senha") ||
    pathname.startsWith("/redefinir-senha");
  const isLanding = pathname === "/";
  const isLegal =
    pathname === "/termos" || pathname === "/privacidade" || pathname.startsWith("/consentimento/");
  const isPublic = isPublicAuthRoute || isAuthCallback || isLanding || isLegal || isRecovery;

  // Rate limiting por requisição (RF/RNF de Fase 4, complementa a cota
  // mensal de lib/billing/quota.ts) — único ponto de checagem para as 6
  // rotas de geração de IA + busca, em vez de repetir em cada route.ts.
  // Chaveado por user id (estas rotas já exigem auth — sem `user` aqui não
  // há chave, e o próprio route handler responde 401 normalmente).
  if (user) {
    const rateLimitCategory: RatelimitCategory | null = pathname === "/api/ai/tutor/chat"
      ? "tutor-chat"
      : pathname.startsWith("/api/ai/")
        ? "ai"
        : pathname === "/api/search"
          ? "search"
          : null;

    if (rateLimitCategory) {
      const result = await checkRateLimit(rateLimitCategory, user.id);
      if (!result.success) {
        return NextResponse.json(
          { error: "Muitas requisições. Tente novamente em instantes." },
          { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds ?? 60) } },
        );
      }
    }
  }

  // API routes own their own auth responses (401 JSON, not an HTML redirect).
  if (isApi) return supabaseResponse;

  if (!user) {
    if (isPublic) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // From here on, `user` is authenticated.

  // LGPD consent gate (RNF-C01) — precedes onboarding/role, since accepting
  // terms is a precondition to using the product at all, not a role concern.
  // Backstop for Google sign-ins (RF-G01), which skip /cadastro's checkbox
  // entirely — see app/consentimento-conta/.
  const isConsentGate = pathname === "/consentimento-conta";
  if (!isConsentGate && !isAuthCallback && !isLegal && !isRecovery) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("terms_accepted_at")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError || !profile) {
      const url = request.nextUrl.clone();
      url.pathname = "/acesso-indisponivel";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (!profile.terms_accepted_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/consentimento-conta";
      url.search = "";
      if (!isPublicAuthRoute && !isLanding) url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  const needsRoleCheck =
    isPublicAuthRoute ||
    isLanding ||
    (!isOnboarding && !isConsentGate && !isAuthCallback && !isLegal && !isRecovery);
  if (needsRoleCheck) {
    const { data: roles, error: rolesError } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (rolesError) {
      const url = request.nextUrl.clone();
      url.pathname = "/acesso-indisponivel";
      url.search = "";
      return NextResponse.redirect(url);
    }
    const hasRoles = (roles?.length ?? 0) > 0;

    if (isPublicAuthRoute || isLanding) {
      const url = request.nextUrl.clone();
      url.pathname = !hasRoles ? "/onboarding" : homeForRoles(roles!.map((r) => r.role)) ?? "/acesso-indisponivel";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (!hasRoles) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      // Preserve the original destination (e.g. a class invite link) so
      // onboarding can send the user there instead of the default shell.
      url.search = "";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
