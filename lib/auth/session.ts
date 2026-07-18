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
    return { supabase, user: null, fullName: null as string | null, suspendedAt: null as string | null, roles: [] as string[], accessError: false };
  }

  const [{ data: profileRow, error: profileError }, { data: roleRows, error: rolesError }] = await Promise.all([
    supabase.from("profiles").select("full_name, suspended_at").eq("id", user.id).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  return {
    supabase,
    user,
    fullName: profileRow?.full_name ?? null,
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
