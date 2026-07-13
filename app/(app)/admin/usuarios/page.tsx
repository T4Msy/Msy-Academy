import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { ActionButton } from "@/components/admin/ActionButton";
import { toggleSuspend, toggleAdminRole } from "./actions";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Usuários — Admin" };

/** auth.users isn't queryable via PostgREST (different schema) — listUsers() + a 2-query merge with profiles/user_roles, same pattern as postgrest-embed-no-fk. perPage caps at 200: fine for V1 volume, pagination is V2/scale work. */
export default async function AdminUsuariosPage() {
  const admin = createAdminClient();

  interface ProfileRow {
    id: string;
    full_name: string | null;
    suspended_at: string | null;
    tenant_id: string;
    tenants: { name: string } | { name: string }[] | null;
  }

  const [{ data: authUsers }, { data: profiles }, { data: roles }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    admin.from("profiles").select("id, full_name, suspended_at, tenant_id, tenants(name)"),
    admin.from("user_roles").select("user_id, role"),
  ]);

  const profileById = new Map<string, ProfileRow>((profiles as ProfileRow[] | null ?? []).map((p) => [p.id, p]));
  const rolesByUser = new Map<string, string[]>();
  for (const r of (roles ?? []) as { user_id: string; role: string }[]) {
    const list = rolesByUser.get(r.user_id) ?? [];
    list.push(r.role);
    rolesByUser.set(r.user_id, list);
  }

  const rows = ((authUsers?.users ?? []) as { id: string; email?: string }[]).map((u) => {
    const profile = profileById.get(u.id);
    const tenantName = Array.isArray(profile?.tenants) ? profile?.tenants[0]?.name : profile?.tenants?.name;
    return {
      id: u.id,
      email: u.email ?? "",
      name: profile?.full_name ?? "—",
      tenantName: tenantName ?? "—",
      suspended: Boolean(profile?.suspended_at),
      roles: rolesByUser.get(u.id) ?? [],
    };
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Usuários</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">{rows.length} usuário{rows.length !== 1 ? "s" : ""}.</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState variant="turma" title="Nenhum usuário ainda" />
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((u) => (
            <div key={u.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
              <div className="flex flex-col gap-4.5 p-5.5">
                <div className="mb-2 mt-0.5 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{u.tenantName}</span>
                  {u.roles.map((r) => (
                    <span key={r} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{r}</span>
                  ))}
                  {u.suspended && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Suspenso</span>}
                </div>
                <p className="mb-1">
                  <b>{u.name}</b>
                </p>
                <p className="field-hint mt-0 mb-sm">{u.email}</p>
                <div className="flex flex-wrap justify-start gap-2">
                  <ActionButton
                    action={toggleSuspend.bind(null, u.id, !u.suspended)}
                    label={u.suspended ? "Reativar" : "Suspender"}
                    variant={u.suspended ? "ghost" : "danger"}
                  />
                  <ActionButton
                    action={toggleAdminRole.bind(null, u.id, !u.roles.includes("ADMIN"))}
                    label={u.roles.includes("ADMIN") ? "Remover admin" : "Tornar admin"}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
