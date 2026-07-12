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
      <div className="page-head">
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">{rows.length} usuário{rows.length !== 1 ? "s" : ""}.</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState variant="turma" title="Nenhum usuário ainda" />
      ) : (
        <div className="stack-md">
          {rows.map((u) => (
            <div key={u.id} className="card">
              <div className="card-body">
                <div className="exam-meta mb-sm">
                  <span className="chip">{u.tenantName}</span>
                  {u.roles.map((r) => (
                    <span key={r} className="chip">{r}</span>
                  ))}
                  {u.suspended && <span className="chip">Suspenso</span>}
                </div>
                <p className="mb-xs">
                  <b>{u.name}</b>
                </p>
                <p className="field-hint mt-0 mb-sm">{u.email}</p>
                <div className="popover-row popover-row--start">
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
