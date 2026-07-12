import { redirect } from "next/navigation";
import { getSession, getRecentNotifications } from "@/lib/auth/session";
import { Topbar } from "@/components/shell/Topbar";
import { Sidebar, type SidebarSection } from "@/components/shell/Sidebar";
import { MobileTabBar } from "@/components/shell/MobileTabBar";
import {
  IconHome,
  IconProvas,
  IconNovaProva,
  IconAtividade,
  IconPlano,
  IconBiblioteca,
  IconQuestoes,
  IconTurma,
  IconCorrecao,
  IconDashboard,
} from "@/components/shell/navIcons";

const NAV: SidebarSection[] = [
  { items: [{ href: "/professor", label: "Início", icon: <IconHome />, exact: true, mobilePrimary: true }] },
  {
    title: "Provas",
    items: [
      { href: "/professor/provas", label: "Minhas Provas", icon: <IconProvas />, mobilePrimary: true },
      { href: "/professor/provas/nova", label: "Nova Prova", icon: <IconNovaProva /> },
    ],
  },
  {
    title: "Criar",
    items: [
      { href: "/professor/atividades/nova", label: "Atividade", icon: <IconAtividade /> },
      { href: "/professor/planos-de-aula/nova", label: "Plano de aula", icon: <IconPlano /> },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { href: "/professor/biblioteca", label: "Biblioteca", icon: <IconBiblioteca /> },
      { href: "/professor/banco-de-questoes", label: "Banco de Questões", icon: <IconQuestoes /> },
    ],
  },
  {
    title: "Turma",
    items: [
      { href: "/professor/turmas", label: "Turmas", icon: <IconTurma />, mobilePrimary: true },
      { href: "/professor/correcao", label: "Correção", icon: <IconCorrecao />, mobilePrimary: true },
      { href: "/professor/dashboard", label: "Dashboard", icon: <IconDashboard /> },
    ],
  },
];

export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const { user, fullName, roles } = await getSession();
  if (!user) redirect("/login");

  const roleSet = new Set(roles);
  if (!roleSet.has("PROFESSOR")) redirect("/aluno");

  const notifications = await getRecentNotifications();

  const name = fullName || user.email?.split("@")[0] || "Professor";

  return (
    <div className="app-shell">
      <Topbar
        name={name}
        email={user.email ?? ""}
        currentEnv="PROFESSOR"
        hasOtherEnv={roleSet.has("ALUNO")}
        settingsHref="/professor/configuracoes"
        notifications={notifications}
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
