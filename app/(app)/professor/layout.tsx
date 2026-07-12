import { redirect } from "next/navigation";
import { getSession, getRecentNotifications } from "@/lib/auth/session";
import { Topbar } from "@/components/shell/Topbar";
import { Sidebar, type SidebarSection } from "@/components/shell/Sidebar";

const NAV: SidebarSection[] = [
  { items: [{ href: "/professor", label: "Início", exact: true }] },
  {
    title: "Provas",
    items: [
      { href: "/professor/provas", label: "Minhas Provas" },
      { href: "/professor/provas/nova", label: "Nova Prova" },
    ],
  },
  {
    title: "Criar",
    items: [
      { href: "/professor/atividades/nova", label: "Atividade" },
      { href: "/professor/planos-de-aula/nova", label: "Plano de aula" },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { href: "/professor/biblioteca", label: "Biblioteca" },
      { href: "/professor/banco-de-questoes", label: "Banco de Questões" },
    ],
  },
  {
    title: "Turma",
    items: [
      { href: "/professor/turmas", label: "Turmas" },
      { href: "/professor/correcao", label: "Correção" },
      { href: "/professor/dashboard", label: "Dashboard" },
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
    </div>
  );
}
