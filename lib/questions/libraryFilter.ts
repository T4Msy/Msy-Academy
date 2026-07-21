import { createClient } from "@/lib/supabase/server";
export async function findQuestionMaterialRefs(tags: string[], bnccCodes: string[]): Promise<string[]> {
  const supabase = await createClient();
  let ids: Set<string> | null = null;
  if (tags.length) { const { data } = await supabase.from("questions").select("id").overlaps("tags", tags); ids = new Set((data ?? []).map((row) => row.id)); }
  if (bnccCodes.length) { const { data: skills } = await supabase.from("bncc_skills").select("id").in("code", bnccCodes); const { data } = skills?.length ? await supabase.from("question_bncc_skills").select("question_id").in("bncc_skill_id", skills.map((s) => s.id)) : { data: [] as { question_id: string }[] }; const next = new Set((data ?? []).map((row) => row.question_id)); ids = ids ? new Set([...ids].filter((id) => next.has(id))) : next; }
  if (!ids?.size) return [];
  const values = [...ids];
  const [{ data: exams }, { data: activities }] = await Promise.all([supabase.from("exam_questions").select("exam_id").in("question_id", values), supabase.from("activity_items").select("activity_id").in("question_id", values)]);
  return [...new Set([...(exams ?? []).map((row) => row.exam_id), ...(activities ?? []).map((row) => row.activity_id)])];
}
