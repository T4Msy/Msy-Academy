import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Per-request session read, memoized via React's `cache()` — every
 * layout.tsx/page.tsx in the same request tree that calls `getSession()`
 * resolves to the same underlying promise (one auth.getUser() + one
 * profiles + one user_roles query total, no matter how many call sites).
 * `profiles` selects the union of columns every caller needs.
 */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, fullName: null as string | null, displayName: null as string | null, avatarUrl: null as string | null, profile: null, suspendedAt: null as string | null, roles: [] as string[], accessError: false };
  }

  // Uma única query com todas as colunas (críticas + opcionais) em vez de
  // duas sequenciais — cada round-trip a mais aqui é pago em TODA navegação
  // autenticada da plataforma (este hook roda no layout raiz de /professor e
  // /aluno), então vale a pena não separar "crítico" de "opcional" em duas
  // idas ao banco. Colunas opcionais continuam nunca bloqueando o acesso:
  // se a query falhar por qualquer motivo, cai no fallback abaixo.
  const [{ data: profileRow, error: profileError }, { data: roleRows, error: rolesError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, suspended_at, display_name, bio, institution, discipline, grade_interest, study_goal, avatar_path, show_avatar")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  if (profileError) {
    console.error("[auth/session] consulta do perfil falhou", {
      code: profileError.code,
      message: profileError.message,
      userId: user.id.slice(0, 8),
      table: "profiles",
      stage: "profile",
    });
  }
  if (rolesError) {
    console.error("[auth/session] consulta de papéis falhou", {
      code: rolesError.code,
      message: rolesError.message,
      userId: user.id.slice(0, 8),
      table: "user_roles",
      stage: "roles",
    });
  }

  let avatarUrl: string | null = null;
  if (profileRow?.avatar_path && profileRow.show_avatar !== false) {
    const { data } = await supabase.storage.from("avatars").createSignedUrl(profileRow.avatar_path, 60 * 60);
    avatarUrl = data?.signedUrl ?? null;
  }

  return {
    supabase,
    user,
    fullName: profileRow?.full_name ?? null,
    displayName: profileRow?.display_name ?? null,
    avatarUrl,
    profile: profileRow ?? null,
    suspendedAt: profileRow?.suspended_at ?? null,
    roles: (roleRows ?? []).map((r) => r.role),
    accessError: Boolean(profileError || rolesError || !profileRow),
  };
});

/** RLS already scopes this to the caller — no user id needed. */
export const getRecentNotifications = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, link, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
});
