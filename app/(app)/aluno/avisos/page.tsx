import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { AnnouncementBrowser, type AnnouncementListItem } from "@/components/announcements/AnnouncementBrowser";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Avisos" };

export default async function AlunoAvisosPage() {
  const supabase = await createClient();
  const { data: classes } = await supabase.rpc("student_visible_classes");
  const classRows = (classes ?? []) as { id: string; name: string }[];
  const classIds = classRows.map((item) => item.id);
  const [{ data: announcements }, { data: teachers }] = await Promise.all([
    classIds.length ? supabase.from("class_announcements").select("id, class_id, message, created_at").in("class_id", classIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as { id: string; class_id: string; message: string; created_at: string }[] }),
    classIds.length ? supabase.rpc("student_class_teacher_names", { p_class_ids: classIds }) : Promise.resolve({ data: [] as { class_id: string; teacher_name: string | null }[] }),
  ]);
  const classNameById = new Map(classRows.map((item) => [item.id, item.name]));
  const teacherRows = (teachers ?? []) as { class_id: string; teacher_name: string | null }[];
  const teacherByClassId = new Map<string, string | null>(teacherRows.map((item) => [item.class_id, item.teacher_name]));
  const items: AnnouncementListItem[] = (announcements ?? []).map((item) => ({ id: item.id, message: item.message, createdAt: item.created_at, classId: item.class_id, className: classNameById.get(item.class_id) ?? "Turma", teacherName: teacherByClassId.get(item.class_id) ?? null }));
  return <><PageHeader title="Avisos" subtitle="Acompanhe os comunicados das suas turmas." /><AnnouncementBrowser announcements={items} showTeacher /></>;
}
