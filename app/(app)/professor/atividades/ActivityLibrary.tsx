import { createClient } from "@/lib/supabase/server";
import { ActivityLibraryClient, type ActivityLibraryItem } from "./ActivityLibraryClient";

export async function ActivityLibrary() {
  const supabase = await createClient();
  const modern = await supabase.from("activities").select("id, title, subject_id, grade_level_id, generation_params, origin, status, ai_provider, created_at, updated_at").order("created_at", { ascending: false });
  let activities = modern.data;
  if (modern.error && (modern.error.code === "42703" || modern.error.code === "PGRST204" || /column .* does not exist/i.test(modern.error.message))) {
    const legacy = await supabase.from("activities").select("id, title, subject_id, grade_level_id, generation_params, status, ai_provider, created_at, updated_at").order("created_at", { ascending: false });
    activities = (legacy.data ?? []).map((activity) => ({ ...activity, origin: activity.ai_provider ? "ai" : "manual" }));
    if (legacy.error) return <ActivityLibraryClient activities={[]} error="Não foi possível carregar suas atividades. Tente novamente." />;
  } else if (modern.error) {
    return <ActivityLibraryClient activities={[]} error="Não foi possível carregar suas atividades. Tente novamente." />;
  }
  const ids = (activities ?? []).map((activity) => activity.id);
  const { data: items } = ids.length ? await supabase.from("activity_items").select("activity_id").in("activity_id", ids) : { data: [] as { activity_id: string }[] };
  const countByActivity = new Map<string, number>();
  for (const item of items ?? []) countByActivity.set(item.activity_id, (countByActivity.get(item.activity_id) ?? 0) + 1);
  const result: ActivityLibraryItem[] = (activities ?? []).map((activity) => {
    const params = (activity.generation_params ?? {}) as Record<string, unknown>;
    return { id: activity.id, title: activity.title, subject: String(params.materia ?? ""), level: String(params.nivel ?? ""), questionCount: countByActivity.get(activity.id) ?? 0, origin: activity.origin === "ai" || activity.ai_provider ? "ai" : "manual", status: activity.status, createdAt: activity.created_at };
  });
  return <ActivityLibraryClient activities={result} />;
}
