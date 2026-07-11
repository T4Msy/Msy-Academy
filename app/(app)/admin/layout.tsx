import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";
import { Sidebar, type SidebarSection } from "@/components/shell/Sidebar";
import { Logo } from "@/components/Logo";

const NAV: SidebarSection[] = [
  { items: [{ href: "/admin", label: "Visão geral", exact: true }] },
  {
    title: "Gestão",
    items: [
      { href: "/admin/usuarios", label: "Usuários" },
      { href: "/admin/tenants", label: "Tenants" },
      { href: "/admin/planos", label: "Planos" },
    ],
  },
];

/**
 * RF-AD01-03/AD07. Not built on Topbar/GlobalSearch — those are
 * professor/aluno-shaped (environment switcher, materials search) and don't
 * apply to admin. No new RLS for cross-tenant visibility either: every
 * admin page/action checks ADMIN here (own user_roles row, already
 * client-readable) then reads/writes via the admin client — same discipline
 * as lib/ai/orchestrator.ts.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const isAdmin = (roles ?? []).some((r) => r.role === "ADMIN");
  if (!isAdmin) redirect("/");

  return (
    <div className="app-shell">
      <header className="topbar" role="banner">
        <div className="topbar-inner">
          <div className="brand">
            <Logo />
            <div>
              <div className="brand-title">MSY Academy</div>
              <div className="brand-sub">Admin</div>
            </div>
          </div>
          <div className="topbar-right">
            <Link href="/" className="btn btn-ghost btn-sm">Voltar ao app</Link>
            <form action={logout}>
              <button type="submit" className="btn btn-ghost btn-sm">Sair</button>
            </form>
          </div>
        </div>
      </header>
      <div className="app-body">
        <Sidebar sections={NAV} />
        <main className="app-main" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
