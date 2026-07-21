import "server-only";
import { createClient } from "@/lib/supabase/server";
import { calculateStudyStreak, type StudyStreak } from "./studyStreakModel";

export interface StudentDashboardStats {
  completedAssignments: number;
  accuracyPct: number | null;
  completedStudyItems: number;
  totalStudyItems: number;
  flashcardDecks: number;
  studyStreak: StudyStreak;
}

/** Reads every student-dashboard metric through the authenticated Supabase client.
 * RLS is therefore the source of truth for the student's own records. */
export async function getStudentDashboardStats(): Promise<StudentDashboardStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");

  const [{ data: submissions }, { data: studyPlans }, { data: decks }] = await Promise.all([
    supabase.from("submissions").select("id, status, submitted_at").eq("student_id", user.id),
    supabase.from("study_plans").select("id").eq("student_id", user.id),
    supabase.from("flashcard_decks").select("id").eq("student_id", user.id),
  ]);

  const completedSubmissions = (submissions ?? []).filter((submission) => submission.status !== "PENDING");
  const submissionIds = completedSubmissions.map((submission) => submission.id);
  const planIds = (studyPlans ?? []).map((plan) => plan.id);
  const [{ data: answers }, { data: studyItems }] = await Promise.all([
    submissionIds.length
      ? supabase.from("submission_answers").select("is_correct").in("submission_id", submissionIds)
      : Promise.resolve({ data: [] as { is_correct: boolean | null }[] }),
    planIds.length
      ? supabase.from("study_plan_items").select("status, item_date").in("study_plan_id", planIds)
      : Promise.resolve({ data: [] as { status: string; item_date: string }[] }),
  ]);

  const gradedAnswers = (answers ?? []).filter((answer) => answer.is_correct !== null);
  const correctAnswers = gradedAnswers.filter((answer) => answer.is_correct).length;

  return {
    completedAssignments: completedSubmissions.length,
    accuracyPct: gradedAnswers.length ? Math.round((correctAnswers / gradedAnswers.length) * 100) : null,
    completedStudyItems: (studyItems ?? []).filter((item) => item.status === "DONE").length,
    totalStudyItems: studyItems?.length ?? 0,
    flashcardDecks: decks?.length ?? 0,
    studyStreak: calculateStudyStreak([
      ...(submissions ?? []).filter((submission) => submission.status !== "PENDING" && submission.submitted_at).map((submission) => submission.submitted_at as string),
      ...(studyItems ?? []).filter((item) => item.status === "DONE").map((item) => item.item_date),
    ]),
  };
}
