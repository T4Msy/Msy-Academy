import { redirect } from "next/navigation";
import { getSession, getRecentNotifications } from "@/lib/auth/session";
import { Topbar } from "@/components/shell/Topbar";
import { Sidebar, type SidebarSection } from "@/components/shell/Sidebar";
import { MobileTabBar } from "@/components/shell/MobileTabBar";
import {
  IconHome,
  IconTutorIA,
  IconAtividade,
  IconSimulados,
  IconPlanoDeEstudos,
  IconFlashcards,
  IconDashboard,
  IconConfiguracoes,
} from "@/components/shell/navIcons";

const NAV: SidebarSection[] = [
  { items: [{ href: "/aluno", label: "Início", icon: <IconHome />, exact: true, mobilePrimary: true }] },
  {
    title: "Estudar",
    items: [
      { href: "/aluno/tutor-ia", label: "Tutor IA", icon: <IconTutorIA />, mobilePrimary: true },
      { href: "/aluno/tarefas", label: "Tarefas", icon: <IconAtividade />, mobilePrimary: true },
      { href: "/aluno/simulados", label: "Simulados", icon: <IconSimulados />, mobilePrimary: true },
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
    items: [{ href: "/aluno/dashboard", label: "Meu Progresso", icon: <IconDashboard /> }],
  },
  {
    title: "Conta",
    items: [{ href: "/aluno/configuracoes", label: "Configurações", icon: <IconConfiguracoes /> }],
  },
];

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, fullName, roles } = await getSession();
  if (!user) redirect("/login");

  const roleSet = new Set(roles);
  if (!roleSet.has("ALUNO")) redirect("/professor");

  const [notifications, { data: guardianConsent }] = await Promise.all([
    getRecentNotifications(),
    supabase.from("guardian_consents").select("status, token").eq("student_id", user.id).eq("status", "PENDING").maybeSingle(),
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
            <div className="notice mb-md">
              Aguardando confirmação de um responsável. Compartilhe este link com ele:{" "}
              <a href={`/consentimento/${guardianConsent.token}`}>{`/consentimento/${guardianConsent.token}`}</a>
            </div>
          )}
          {children}
        </main>
      </div>
      <MobileTabBar sections={NAV} />
    </div>
  );
}
