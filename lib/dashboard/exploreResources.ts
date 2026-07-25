import "server-only";
import { createClient } from "@/lib/supabase/server";
import { buildExploreResources, type ExploreResourceCounts } from "./exploreResourcesModel";
import { STUDY_MATERIAL_KIND } from "@/lib/materials/studyMaterial";

export async function getProfessorExploreResources() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { userId: null, resources: [] };

  const [exams, activities, lessonPlans, questions, materials, assignments, grades, aiGrades, profile] = await Promise.all([
    supabase.from("exams").select("id", { count: "exact", head: true }).eq("author_id", userId).is("deleted_at", null),
    supabase.from("activities").select("id", { count: "exact", head: true }).eq("author_id", userId).not("ai_provider", "is", null).is("deleted_at", null),
    supabase.from("lesson_plans").select("id", { count: "exact", head: true }).eq("author_id", userId).is("deleted_at", null),
    supabase.from("questions").select("id", { count: "exact", head: true }).eq("author_id", userId),
    supabase.from("materials").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("kind", STUDY_MATERIAL_KIND).is("deleted_at", null),
    supabase.from("assignments").select("id", { count: "exact", head: true }),
    supabase.from("grades").select("id", { count: "exact", head: true }),
    supabase.from("grades").select("id", { count: "exact", head: true }).eq("graded_by", "AI_SUGGESTED"),
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
  ]);

  const counts: ExploreResourceCounts = {
    "custom-exam": (exams.count ?? 0) > 0,
    "ai-activity": (activities.count ?? 0) > 0,
    "lesson-plan": (lessonPlans.count ?? 0) > 0,
    "question-bank": (questions.count ?? 0) > 0,
    library: (materials.count ?? 0) > 0,
    "publish-activity": (assignments.count ?? 0) > 0,
    "correct-submission": (grades.count ?? 0) > 0,
    "class-reports": (assignments.count ?? 0) > 0,
    profile: Boolean(profile.data?.full_name?.trim()),
    "ai-correction": (aiGrades.count ?? 0) > 0,
  };
  return { userId, resources: buildExploreResources(counts) };
}
