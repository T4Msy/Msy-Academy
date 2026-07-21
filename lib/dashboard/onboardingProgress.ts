import "server-only";
import { createClient } from "@/lib/supabase/server";
import { deriveProfessorOnboardingProgress, type ProfessorOnboardingProgress } from "./onboardingProgressModel";
export type { ProfessorOnboardingProgress } from "./onboardingProgressModel";

/** Uses the persisted enrollment as the invitation signal: invite codes are not persisted as invitation records. */
export async function getProfessorOnboardingProgress(): Promise<ProfessorOnboardingProgress> {
  const supabase = await createClient();
  const [{ data: classes, error: classesError }, { count: examCount, error: examsError }] = await Promise.all([
    supabase.from("classes").select("id").is("deleted_at", null),
    supabase.from("exams").select("id", { count: "exact", head: true }).is("deleted_at", null).neq("status", "ARCHIVED"),
  ]);
  if (classesError) throw classesError;
  if (examsError) throw examsError;

  const classIds = (classes ?? []).map((item) => item.id);
  let enrolledStudent = false;
  if (classIds.length) {
    const { count, error } = await supabase.from("enrollments").select("student_id", { count: "exact", head: true }).in("class_id", classIds).eq("status", "ACTIVE");
    if (error) throw error;
    enrolledStudent = (count ?? 0) > 0;
  }
  return deriveProfessorOnboardingProgress(classIds.length, examCount ?? 0, enrolledStudent ? 1 : 0);
}
