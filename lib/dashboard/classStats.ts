import "server-only";
import { createClient } from "@/lib/supabase/server";
import { deriveClassStats, type ClassStat } from "./deriveClassStats";

/**
 * One batched round trip per table across ALL of the professor's classes,
 * instead of a 4-hop chain repeated per class (was 1+4N queries for N
 * classes, now a constant 5). Grouping/derivation is pure — deriveClassStats.
 * Compartilhado pelo prefetch do Server Component (dashboard/page.tsx) e
 * pelo route handler de refetch (/api/professor/dashboard) — padrão piloto
 * do TanStack Query com hidratação (decisão nº 5 do ADR).
 */
export async function getProfessorClassStats(): Promise<ClassStat[]> {
  const supabase = await createClient();
  const { data: classes } = await supabase.from("classes").select("id, name").order("name");
  const classList = classes ?? [];
  const classIds = classList.map((c) => c.id);

  if (classIds.length === 0) return [];

  const [{ data: enrollments }, { data: assignments }] = await Promise.all([
    supabase.from("enrollments").select("class_id, student_id").in("class_id", classIds).eq("status", "ACTIVE"),
    supabase.from("assignments").select("id, class_id, due_at").in("class_id", classIds),
  ]);

  const studentIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];
  const assignmentIds = (assignments ?? []).map((a) => a.id);

  const [{ data: profiles }, { data: submissions }] = await Promise.all([
    studentIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    assignmentIds.length
      ? supabase.from("submissions").select("id, assignment_id, student_id, status").in("assignment_id", assignmentIds)
      : Promise.resolve({ data: [] as { id: string; assignment_id: string; student_id: string; status: string }[] }),
  ]);

  const submissionIds = (submissions ?? []).map((s) => s.id);
  const { data: answers } = submissionIds.length
    ? await supabase.from("submission_answers").select("submission_id, is_correct").in("submission_id", submissionIds)
    : { data: [] as { submission_id: string; is_correct: boolean | null }[] };

  return deriveClassStats(
    classList,
    enrollments ?? [],
    assignments ?? [],
    submissions ?? [],
    answers ?? [],
    profiles ?? [],
    new Date().toISOString(),
  );
}
