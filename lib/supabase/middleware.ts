import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
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
  const isPublicAuthRoute =
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname.startsWith("/recuperar-senha") ||
    pathname.startsWith("/redefinir-senha");
  const isLanding = pathname === "/";
  const isLegal =
    pathname === "/termos" || pathname === "/privacidade" || pathname.startsWith("/consentimento/");
  const isPublic = isPublicAuthRoute || isAuthCallback || isLanding || isLegal;

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
  const needsRoleCheck = isPublicAuthRoute || isLanding || (!isOnboarding && !isAuthCallback && !isLegal);
  if (needsRoleCheck) {
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const hasRoles = (roles?.length ?? 0) > 0;

    if (isPublicAuthRoute || isLanding) {
      const url = request.nextUrl.clone();
      url.pathname = !hasRoles
        ? "/onboarding"
        : roles!.some((r) => r.role === "PROFESSOR")
          ? "/professor"
          : "/aluno";
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
