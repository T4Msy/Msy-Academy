import { notFound } from "next/navigation";
import { ClipboardCheck, LayoutDashboard, MessageCircle, Sparkles, BookOpen, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ClassHeader, ClassRoleBadge } from "@/components/classes/ClassHeader";
import { ClassTabsNav } from "@/components/classes/ClassTabsNav";
import { ModuleSwitcher } from "@/components/classes/ModuleSwitcher";
import { formatDate } from "@/lib/classes/format";

export const dynamic = "force-dynamic";

type StudentClassRow = { id: string; name: string; created_at: string; subject_id: string | null };

export default async function AlunoTurmaLayout({
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
  if (!user) notFound();

  const [{ data: enrollment }, { data: classRows }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("created_at")
      .eq("class_id", id)
      .eq("student_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle(),
    supabase.rpc("student_visible_classes"),
  ]);
  const classroom = ((classRows ?? []) as StudentClassRow[]).find((item) => item.id === id) ?? null;
  if (!classroom || !enrollment) notFound();

  const [{ data: subject }, { data: teacherNames }, { data: modules }, { data: materials }] = await Promise.all([
    classroom.subject_id
      ? supabase.from("subjects").select("name").eq("id", classroom.subject_id).maybeSingle()
      : Promise.resolve({ data: null as { name: string } | null }),
    supabase.rpc("student_class_teacher_names", { p_class_ids: [id] }),
    supabase.from("class_modules").select("id, name, position").eq("class_id", id).is("deleted_at", null).order("position"),
    supabase.from("materials").select("id").eq("class_id", id).is("deleted_at", null),
  ]);

  const materialIds = (materials ?? []).map((m) => m.id);
  const { data: decks } = materialIds.length
    ? await supabase.from("flashcard_decks").select("id").in("source_material_id", materialIds)
    : { data: [] as { id: string }[] };

  const teacherName = (teacherNames ?? [])[0]?.teacher_name ?? null;
  const moduleOptions = (modules ?? []).map((m, index) => ({ id: m.id, name: m.name, isDefault: index === 0 }));
  const base = `/aluno/turmas/${id}`;

  return (
    <>
      <ClassHeader
        backHref="/aluno/turmas"
        backLabel="Minhas turmas"
        title={classroom.name}
        subtitle={
          `${[subject?.name, teacherName].filter(Boolean).join(" · ") || "Ambiente de aprendizagem da turma"} · Entrada em ${formatDate(enrollment.created_at)}`
        }
        roleBadge={<ClassRoleBadge role="Aluno" />}
        moduleSwitcher={<ModuleSwitcher modules={moduleOptions} />}
      />
      <ClassTabsNav
        items={[
          { key: "geral", label: "Geral", href: base, exact: true, icon: <LayoutDashboard className="size-4" aria-hidden /> },
          { key: "colegas", label: "Colegas", href: `${base}/alunos`, icon: <Users className="size-4" aria-hidden /> },
          { key: "atividades", label: "Atividades", href: `${base}/atividades`, icon: <ClipboardCheck className="size-4" aria-hidden /> },
          { key: "notas", label: "Notas", href: `${base}/notas`, icon: <Sparkles className="size-4" aria-hidden /> },
          { key: "materiais", label: "Materiais", href: `${base}/materiais`, icon: <BookOpen className="size-4" aria-hidden /> },
          { key: "chat", label: "Chat", href: `${base}/chat`, icon: <MessageCircle className="size-4" aria-hidden /> },
        ]}
        trailingLink={
          decks && decks.length > 0
            ? { label: "Flashcards", href: `/aluno/flashcards?materialIds=${materialIds.join(",")}` }
            : undefined
        }
      />
      {children}
    </>
  );
}
