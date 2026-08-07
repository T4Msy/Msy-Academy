import { notFound } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck, LayoutDashboard, MessageCircle, Megaphone, Settings, Sparkles, BookOpen, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ClassHeader, ClassRoleBadge } from "@/components/classes/ClassHeader";
import { ClassTabsNav } from "@/components/classes/ClassTabsNav";
import { ModuleSwitcher } from "@/components/classes/ModuleSwitcher";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ProfessorTurmaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: klass }, { data: modules }, { count: studentCount }] = await Promise.all([
    supabase.from("classes").select("id, name, owner_id, invite_code, created_at").eq("id", id).maybeSingle(),
    supabase.from("class_modules").select("id, name, position").eq("class_id", id).is("deleted_at", null).order("position"),
    supabase.from("enrollments").select("student_id", { count: "exact", head: true }).eq("class_id", id).eq("status", "ACTIVE"),
  ]);
  if (!klass || user?.id !== klass.owner_id) notFound();

  const moduleOptions = (modules ?? []).map((m, index) => ({ id: m.id, name: m.name, isDefault: index === 0 }));
  const base = `/professor/turmas/${id}`;

  return (
    <>
      <ClassHeader
        backHref="/professor/turmas"
        backLabel="Turmas"
        title={klass.name}
        subtitle={`${studentCount ?? 0} aluno${studentCount === 1 ? "" : "s"} matriculado${studentCount === 1 ? "" : "s"} · Código ${klass.invite_code}`}
        roleBadge={<ClassRoleBadge role="Professor" />}
        moduleSwitcher={<ModuleSwitcher modules={moduleOptions} />}
        actions={
          <>
            <Link href={`${base}/configuracoes`}>
              <Button type="button" variant="outline" size="icon" aria-label="Configurações da turma">
                <Settings className="size-4" aria-hidden />
              </Button>
            </Link>
          </>
        }
      />
      <ClassTabsNav
        items={[
          { key: "geral", label: "Geral", href: base, exact: true, icon: <LayoutDashboard className="size-4" aria-hidden /> },
          { key: "alunos", label: "Alunos", href: `${base}/alunos`, icon: <Users className="size-4" aria-hidden /> },
          { key: "atividades", label: "Atividades", href: `${base}/atividades`, icon: <ClipboardCheck className="size-4" aria-hidden /> },
          { key: "materiais", label: "Materiais", href: `${base}/materiais`, icon: <BookOpen className="size-4" aria-hidden /> },
          { key: "avisos", label: "Avisos", href: `${base}/avisos`, icon: <Megaphone className="size-4" aria-hidden /> },
          { key: "correcao", label: "Correções", href: `/professor/correcao/turma/${id}`, icon: <ClipboardCheck className="size-4" aria-hidden /> },
          { key: "notas", label: "Desempenho", href: `${base}/notas`, icon: <Sparkles className="size-4" aria-hidden /> },
          { key: "chat", label: "Chat", href: `${base}/chat`, icon: <MessageCircle className="size-4" aria-hidden /> },
        ]}
      />
      {children}
    </>
  );
}
