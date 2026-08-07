import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ProfessorWorkDashboard = {
  classes: Array<{ id: string; name: string; students: number; pendingCorrections: number; materials: number }>;
  pendingCorrections: number;
  recentlyGraded: number;
  mostPendingClass: { id: string; name: string; pending: number } | null;
  upcoming: Array<{ id: string; classId: string; className: string; title: string; kind: "Prova" | "Atividade"; dueAt: string }>;
  latestAnnouncement: { className: string; message: string; createdAt: string } | null;
};

/** Batches the existing work data once for the teacher home; no per-card queries. */
export async function getProfessorWorkDashboard(userId: string): Promise<ProfessorWorkDashboard> {
  const supabase = await createClient();
  const { data: classes } = await supabase.from("classes").select("id, name").eq("owner_id", userId).order("name");
  const classList = classes ?? [];
  const classIds = classList.map((item) => item.id);
  if (!classIds.length) return { classes: [], pendingCorrections: 0, recentlyGraded: 0, mostPendingClass: null, upcoming: [], latestAnnouncement: null };

  const [{ data: enrollments }, { data: assignments }, { data: materials }, { data: announcements }] = await Promise.all([
    supabase.from("enrollments").select("class_id").in("class_id", classIds).eq("status", "ACTIVE"),
    supabase.from("assignments").select("id, class_id, content_id, content_type, due_at").in("class_id", classIds).is("deleted_at", null),
    supabase.from("materials").select("class_id").in("class_id", classIds).is("deleted_at", null),
    supabase.from("class_announcements").select("class_id, message, created_at").in("class_id", classIds).order("created_at", { ascending: false }).limit(1),
  ]);
  const assignmentList = assignments ?? [];
  const assignmentIds = assignmentList.map((item) => item.id);
  const [{ data: submissions }, { data: exams }, { data: activities }] = await Promise.all([
    assignmentIds.length ? supabase.from("submissions").select("assignment_id, status, updated_at").in("assignment_id", assignmentIds) : Promise.resolve({ data: [] as { assignment_id: string | null; status: string; updated_at: string }[] }),
    assignmentList.some((item) => item.content_type === "EXAM") ? supabase.from("exams").select("id, title").in("id", assignmentList.filter((item) => item.content_type === "EXAM").map((item) => item.content_id)) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    assignmentList.some((item) => item.content_type === "ACTIVITY") ? supabase.from("activities").select("id, title").in("id", assignmentList.filter((item) => item.content_type === "ACTIVITY").map((item) => item.content_id)) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const assignmentClass = new Map(assignmentList.map((item) => [item.id, item.class_id]));
  const className = new Map(classList.map((item) => [item.id, item.name]));
  const pendingByClass = new Map(classIds.map((id) => [id, 0]));
  let pendingCorrections = 0;
  let recentlyGraded = 0;
  const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const submission of submissions ?? []) {
    const classId = submission.assignment_id ? assignmentClass.get(submission.assignment_id) : undefined;
    if (!classId) continue;
    if (submission.status === "SUBMITTED") { pendingCorrections += 1; pendingByClass.set(classId, (pendingByClass.get(classId) ?? 0) + 1); }
    if (submission.status === "GRADED" && new Date(submission.updated_at).getTime() >= recentCutoff) recentlyGraded += 1;
  }
  const studentsByClass = new Map<string, number>();
  const materialsByClass = new Map<string, number>();
  for (const enrollment of enrollments ?? []) studentsByClass.set(enrollment.class_id, (studentsByClass.get(enrollment.class_id) ?? 0) + 1);
  for (const material of materials ?? []) if (material.class_id) materialsByClass.set(material.class_id, (materialsByClass.get(material.class_id) ?? 0) + 1);
  const titleById = new Map<string, string>();
  for (const item of exams ?? []) titleById.set(item.id, item.title);
  for (const item of activities ?? []) titleById.set(item.id, item.title);
  const now = Date.now();
  const upcoming: ProfessorWorkDashboard["upcoming"] = assignmentList.filter((item) => item.due_at && new Date(item.due_at).getTime() >= now).sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime()).slice(0, 3).map((item) => ({ id: item.id, classId: item.class_id, className: className.get(item.class_id) ?? "Turma", title: titleById.get(item.content_id) ?? (item.content_type === "EXAM" ? "Prova" : "Atividade"), kind: item.content_type === "EXAM" ? "Prova" as const : "Atividade" as const, dueAt: item.due_at! }));
  const mostPending = [...pendingByClass.entries()].sort((a, b) => b[1] - a[1])[0];
  const latest = announcements?.[0];
  return { classes: classList.map((item) => ({ id: item.id, name: item.name, students: studentsByClass.get(item.id) ?? 0, pendingCorrections: pendingByClass.get(item.id) ?? 0, materials: materialsByClass.get(item.id) ?? 0 })), pendingCorrections, recentlyGraded, mostPendingClass: mostPending?.[1] ? { id: mostPending[0], name: className.get(mostPending[0]) ?? "Turma", pending: mostPending[1] } : null, upcoming, latestAnnouncement: latest ? { className: className.get(latest.class_id) ?? "Turma", message: latest.message, createdAt: latest.created_at } : null };
}
