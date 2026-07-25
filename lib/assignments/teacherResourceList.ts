import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type TeacherAssignmentRow = {
  id: string;
  class_id: string;
  content_id: string;
  due_at: string | null;
  audience_type: "class" | "students";
  created_at: string;
};

export type TeacherAssignmentGroup = {
  classId: string;
  className: string;
  assignments: TeacherAssignmentRow[];
  activeStudents: number;
  recipientsByAssignment: Map<string, number>;
  submissionsByAssignment: Map<string, number>;
};

export async function loadTeacherAssignmentGroups(
  supabase: SupabaseServerClient,
  contentType: "EXAM" | "ACTIVITY",
): Promise<TeacherAssignmentGroup[]> {
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select("id, class_id, content_id, due_at, audience_type, created_at")
    .eq("content_type", contentType)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !assignments?.length) return [];

  const rows = assignments as TeacherAssignmentRow[];
  const classIds = [...new Set(rows.map((row) => row.class_id))];
  const assignmentIds = rows.map((row) => row.id);
  const [{ data: classes }, { data: enrollments }, { data: explicitRecipients }, { data: submissions }] = await Promise.all([
    supabase.from("classes").select("id, name").in("id", classIds),
    supabase.from("enrollments").select("class_id").in("class_id", classIds).eq("status", "ACTIVE"),
    supabase.from("assignment_students").select("assignment_id").in("assignment_id", assignmentIds),
    supabase.from("submissions").select("assignment_id").in("assignment_id", assignmentIds),
  ]);

  const classNameById = new Map((classes ?? []).map((item) => [item.id, item.name]));
  const activeStudentsByClass = new Map<string, number>();
  for (const enrollment of enrollments ?? []) activeStudentsByClass.set(enrollment.class_id, (activeStudentsByClass.get(enrollment.class_id) ?? 0) + 1);
  const explicitCount = new Map<string, number>();
  for (const recipient of explicitRecipients ?? []) explicitCount.set(recipient.assignment_id, (explicitCount.get(recipient.assignment_id) ?? 0) + 1);
  const submissionCount = new Map<string, number>();
  for (const submission of submissions ?? []) submissionCount.set(submission.assignment_id, (submissionCount.get(submission.assignment_id) ?? 0) + 1);

  const groups = new Map<string, TeacherAssignmentGroup>();
  for (const row of rows) {
    const group: TeacherAssignmentGroup = groups.get(row.class_id) ?? {
      classId: row.class_id,
      className: classNameById.get(row.class_id) ?? "Turma",
      assignments: [],
      activeStudents: activeStudentsByClass.get(row.class_id) ?? 0,
      recipientsByAssignment: new Map<string, number>(),
      submissionsByAssignment: new Map<string, number>(),
    };
    group.assignments.push(row);
    group.recipientsByAssignment.set(row.id, row.audience_type === "class" ? group.activeStudents : explicitCount.get(row.id) ?? 0);
    group.submissionsByAssignment.set(row.id, submissionCount.get(row.id) ?? 0);
    groups.set(row.class_id, group);
  }
  return [...groups.values()].sort((a, b) => a.className.localeCompare(b.className, "pt-BR"));
}

export function assignmentStatus(dueAt: string | null): "Ativa" | "Encerrada" {
  return dueAt && new Date(dueAt).getTime() <= Date.now() ? "Encerrada" : "Ativa";
}
