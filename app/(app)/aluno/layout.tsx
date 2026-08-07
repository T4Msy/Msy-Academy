import { redirect } from "next/navigation";
import { getSession, getRecentNotifications } from "@/lib/auth/session";
import { Topbar } from "@/components/shell/Topbar";
import { Sidebar, type SidebarSection } from "@/components/shell/Sidebar";
import { MobileTabBar } from "@/components/shell/MobileTabBar";
import { homeForRoles } from "@/lib/auth/access";
import { IconHome, IconTutorIA, IconAtividade, IconTurma, IconSimulados, IconPlanoDeEstudos, IconFlashcards, IconEstudoAnimado, IconBiblioteca, IconDashboard, IconConfiguracoes, IconPerfil } from "@/components/shell/navIcons";
import { Megaphone } from "lucide-react";

const NAV: SidebarSection[] = [
  { items: [{ href: "/aluno", label: "Início", icon: <IconHome />, exact: true, mobilePrimary: true }] },
  { title: "Meu espaço de estudos", items: [{ href: "/aluno/turmas", label: "Minhas Turmas", icon: <IconTurma />, mobilePrimary: true }, { href: "/aluno/avisos", label: "Avisos", icon: <Megaphone size={18} strokeWidth={1.6} aria-hidden /> }, { href: "/aluno/tarefas", label: "Resolver", icon: <IconAtividade />, mobilePrimary: true }, { href: "/aluno/materiais", label: "Conteúdos", icon: <IconBiblioteca /> }] },
  { title: "Continuar aprendendo", items: [{ href: "/aluno/tutor-ia", label: "Perguntar", icon: <IconTutorIA /> }, { href: "/aluno/simulados", label: "Simulado", icon: <IconSimulados /> }, { href: "/aluno/flashcards", label: "Revisar", icon: <IconFlashcards /> }] },
  { title: "Organizar", items: [{ href: "/aluno/plano-de-estudos", label: "Planejar", icon: <IconPlanoDeEstudos /> }, { href: "/aluno/estudo-animado", label: "Treinar", icon: <IconEstudoAnimado /> }] },
  { title: "Acompanhar", items: [{ href: "/aluno/dashboard", label: "Meu Progresso", mobileLabel: "Progresso", icon: <IconDashboard />, mobilePrimary: true }] },
  { title: "Conta", items: [{ href: "/aluno/perfil", label: "Perfil", icon: <IconPerfil /> }, { href: "/aluno/configuracoes", label: "Configurações", icon: <IconConfiguracoes /> }] },
];

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  // getRecentNotifications() não depende do resultado de getSession() — roda
  // em paralelo com ela em vez de encadeado depois (só a query de
  // guardian_consents precisa de user.id, então essa continua depois).
  const [{ supabase, user, fullName, displayName, avatarUrl, roles, accessError }, notifications] = await Promise.all([
    getSession(),
    getRecentNotifications(),
  ]);
  if (!user || accessError) redirect("/acesso-indisponivel");
  const roleSet = new Set(roles);
  if (!roleSet.has("ALUNO")) redirect(homeForRoles(roles) ?? "/acesso-indisponivel");
  const { data: guardianConsent } = await supabase.from("guardian_consents").select("status, token").eq("student_id", user.id).eq("status", "PENDING").maybeSingle();
  const name = displayName || fullName || user.email?.split("@")[0] || "Aluno";
  return <div className="app-shell"><Topbar name={name} email={user.email ?? ""} avatarUrl={avatarUrl} currentEnv="ALUNO" hasOtherEnv={roleSet.has("PROFESSOR")} settingsHref="/aluno/configuracoes" profileHref="/aluno/perfil" notifications={notifications} /><div className="app-body"><Sidebar sections={NAV} /><main className="app-main" role="main">{guardianConsent && <div className="mb-4 rounded-md border border-brand-border bg-brand-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-brand-text">Aguardando confirmação de um responsável. Compartilhe este link com ele: <a href={`/consentimento/${guardianConsent.token}`}>{`/consentimento/${guardianConsent.token}`}</a></div>}{children}</main></div><MobileTabBar sections={NAV} /></div>;
}
