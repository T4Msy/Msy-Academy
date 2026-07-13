import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { logout } from "@/lib/auth/actions";
import { Sidebar, type SidebarSection } from "@/components/shell/Sidebar";
import { MobileTabBar } from "@/components/shell/MobileTabBar";
import { Topbar } from "@/components/shell/Topbar";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { IconHome, IconUsuarios, IconTenants, IconPlanosAdmin } from "@/components/shell/navIcons";

const NAV: SidebarSection[] = [
  { items: [{ href: "/admin", label: "Visão geral", icon: <IconHome />, exact: true, mobilePrimary: true }] },
  {
    title: "Gestão",
    items: [
      { href: "/admin/usuarios", label: "Usuários", icon: <IconUsuarios />, mobilePrimary: true },
      { href: "/admin/tenants", label: "Tenants", icon: <IconTenants />, mobilePrimary: true },
      { href: "/admin/planos", label: "Planos", icon: <IconPlanosAdmin />, mobilePrimary: true },
    ],
  },
];

/**
 * RF-AD01-03/AD07. Uses Topbar's "minimal" variant — GlobalSearch and
 * ContextSwitcher are professor/aluno-shaped (materials search, environment
 * switcher) and don't apply to admin. No new RLS for cross-tenant visibility
 * either: every admin page/action checks ADMIN here (own user_roles row,
 * already client-readable) then reads/writes via the admin client — same
 * discipline as lib/ai/orchestrator.ts.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, roles } = await getSession();
  if (!user) redirect("/login");

  const isAdmin = roles.includes("ADMIN");
  if (!isAdmin) redirect("/");

  return (
    <div className="app-shell">
      <Topbar
        variant="minimal"
        subtitle="Admin"
        rightSlot={
          <>
            <ThemeToggle variant="icon" />
            <Link href="/" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm">Voltar ao app</Link>
            <form action={logout}>
              <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm">Sair</button>
            </form>
          </>
        }
      />
      <div className="app-body">
        <Sidebar sections={NAV} />
        <main className="app-main" role="main">
          {children}
        </main>
      </div>
      <MobileTabBar sections={NAV} />
    </div>
  );
}
