import { redirect } from "next/navigation";
import { getSession, getRecentNotifications } from "@/lib/auth/session";
import { Topbar } from "@/components/shell/Topbar";
import { Sidebar, type SidebarSection } from "@/components/shell/Sidebar";
import { MobileTabBar } from "@/components/shell/MobileTabBar";
import { homeForRoles } from "@/lib/auth/access";
import {
  IconHome,
  IconTutorIA,
  IconAtividade,
  IconTurma,
  IconSimulados,
  IconPlanoDeEstudos,
  IconFlashcards,
  IconDashboard,
  IconConfiguracoes,
} from "@/components/shell/navIcons";

const NAV: SidebarSection[] = [
  {
    items: [
      { href: "/aluno", label: "Início", icon: <IconHome />, exact: true, mobilePrimary: true },
    ],
  },
  {
    title: "Estudar",
    items: [
      { href: "/aluno/tutor-ia", label: "Tutor IA", icon: <IconTutorIA />, mobilePrimary: true },
      { href: "/aluno/tarefas", label: "Tarefas", icon: <IconAtividade />, mobilePrimary: true },
      { href: "/aluno/turmas", label: "Minhas Turmas", icon: <IconTurma /> },
      { href: "/aluno/simulados", label: "Simulados", icon: <IconSimulados /> },
    ],
  },
  {
    title: "Organizar",
    items: [
      { href: "/aluno/plano-de-estudos", label: "Plano de Estudos", icon: <IconPlanoDeEstudos /> },
      { href: "/aluno/flashcards", label: "Flashcards", icon: <IconFlashcards /> },
    ],
  },
  {
    title: "Análise",
    items: [
      {
        href: "/aluno/dashboard",
        label: "Meu Progresso",
        mobileLabel: "Progresso",
        icon: <IconDashboard />,
        mobilePrimary: true,
      },
    ],
  },
  {
    title: "Conta",
    items: [{ href: "/aluno/configuracoes", label: "Configurações", icon: <IconConfiguracoes /> }],
  },
];

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, fullName, roles, accessError } = await getSession();
  if (!user || accessError) redirect("/acesso-indisponivel");

  const roleSet = new Set(roles);
  if (!roleSet.has("ALUNO")) redirect(homeForRoles(roles) ?? "/acesso-indisponivel");

  const [notifications, { data: guardianConsent }] = await Promise.all([
    getRecentNotifications(),
    supabase
      .from("guardian_consents")
      .select("status, token")
      .eq("student_id", user.id)
      .eq("status", "PENDING")
      .maybeSingle(),
  ]);

  const name = fullName || user.email?.split("@")[0] || "Aluno";

  return (
    <div className="app-shell">
      <Topbar
        name={name}
        email={user.email ?? ""}
        currentEnv="ALUNO"
        hasOtherEnv={roleSet.has("PROFESSOR")}
        settingsHref="/aluno/configuracoes"
        notifications={notifications}
      />
      <div className="app-body">
        <Sidebar sections={NAV} />
        <main className="app-main" role="main">
          {guardianConsent && (
            <div className="mb-4 rounded-md border border-brand-border bg-brand-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-brand-text">
              Aguardando confirmação de um responsável. Compartilhe este link com ele:{" "}
              <a
                href={`/consentimento/${guardianConsent.token}`}
              >{`/consentimento/${guardianConsent.token}`}</a>
            </div>
          )}
          {children}
        </main>
      </div>
      <MobileTabBar sections={NAV} />
    </div>
  );
}
