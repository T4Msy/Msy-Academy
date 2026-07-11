import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/shell/Topbar";
import { Sidebar, type SidebarSection } from "@/components/shell/Sidebar";

const NAV: SidebarSection[] = [
  { items: [{ href: "/aluno", label: "Início", exact: true }] },
  {
    title: "Estudar",
    items: [
      { href: "/aluno/tutor-ia", label: "Tutor IA" },
      { href: "/aluno/tarefas", label: "Tarefas" },
      { href: "/aluno/simulados", label: "Simulados" },
    ],
  },
  {
    title: "Organizar",
    items: [
      { href: "/aluno/plano-de-estudos", label: "Plano de Estudos" },
      { href: "/aluno/flashcards", label: "Flashcards" },
      { href: "/aluno/dashboard", label: "Dashboard" },
    ],
  },
];

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: roles }, { data: notifications }, { data: guardianConsent }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("notifications").select("id, title, body, link, read_at, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("guardian_consents").select("status, token").eq("student_id", user.id).eq("status", "PENDING").maybeSingle(),
  ]);

  const roleSet = new Set((roles ?? []).map((r) => r.role));
  if (!roleSet.has("ALUNO")) redirect("/professor");

  const name = profile?.full_name || user.email?.split("@")[0] || "Aluno";

  return (
    <div className="app-shell">
      <Topbar
        name={name}
        email={user.email ?? ""}
        currentEnv="ALUNO"
        hasOtherEnv={roleSet.has("PROFESSOR")}
        settingsHref="/aluno/configuracoes"
        notifications={notifications ?? []}
      />
      <div className="app-body">
        <Sidebar sections={NAV} />
        <main className="app-main" role="main">
          {guardianConsent && (
            <div className="notice" style={{ marginBottom: 16 }}>
              Aguardando confirmação de um responsável. Compartilhe este link com ele:{" "}
              <a href={`/consentimento/${guardianConsent.token}`}>{`/consentimento/${guardianConsent.token}`}</a>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
