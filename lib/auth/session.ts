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

  // Keep the authentication-critical query limited to columns that existed in
  // the original schema. Optional profile fields may be unavailable until the
  // profile migration is applied and must never lock the whole application.
  const [{ data: baseProfile, error: profileError }, { data: roleRows, error: rolesError }] = await Promise.all([
    supabase.from("profiles").select("full_name, suspended_at").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  if (profileError) {
    console.error("[auth/session] consulta do perfil base falhou", {
      code: profileError.code,
      message: profileError.message,
      userId: user.id.slice(0, 8),
      table: "profiles",
      stage: "base-profile",
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

  let optionalProfile: {
    display_name: string | null;
    bio: string | null;
    institution: string | null;
    discipline: string | null;
    grade_interest: string | null;
    study_goal: string | null;
    avatar_path: string | null;
    show_avatar: boolean | null;
  } | null = null;

  if (baseProfile) {
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, bio, institution, discipline, grade_interest, study_goal, avatar_path, show_avatar")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      console.warn("[auth/session] campos opcionais do perfil indisponíveis; usando valores padrão", {
        code: error.code,
        message: error.message,
        userId: user.id.slice(0, 8),
        table: "profiles",
        stage: "optional-profile",
      });
    } else {
      optionalProfile = data;
    }
  }

  const profileRow = { ...baseProfile, ...(optionalProfile ?? {}) };

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
    profile: baseProfile ? profileRow : null,
    suspendedAt: profileRow?.suspended_at ?? null,
    roles: (roleRows ?? []).map((r) => r.role),
    accessError: Boolean(profileError || rolesError || !baseProfile),
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
