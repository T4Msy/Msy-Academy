import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/ai/orchestrator";
import { LESSON_PLAN_GENERATION_SCHEMA_V1 } from "@/lib/ai/prompts/lesson-plan-generation.v1";
import { getAIProvider } from "@/lib/ai/registry";
import { QuotaExceededError } from "@/lib/billing/quota";
import type { GeneratedLessonPlan } from "@/lib/ai/types";

export const runtime = "nodejs";

/** POST /api/ai/lesson-plans/generate — RF-P13/14. No child rows, so a plain insert (no RPC needed). */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let params: { disciplina?: string; serie?: string; tema?: string; observacoes?: string };
  try {
    params = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const tema = (params.tema ?? "").trim();
  if (!tema) return NextResponse.json({ error: "Informe o tema da aula." }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 500 });

  let generated: GeneratedLessonPlan;
  try {
    generated = await generateStructured<GeneratedLessonPlan>({
      task: "LESSON_PLAN",
      schema: LESSON_PLAN_GENERATION_SCHEMA_V1,
      input: params,
      tenantId: profile.tenant_id,
      userId: user.id,
    });
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Falha ao gerar o plano de aula: ${message}` }, { status: 502 });
  }

  const provider = getAIProvider();

  const { data: lessonPlan, error: insertError } = await supabase
    .from("lesson_plans")
    .insert({
      tenant_id: profile.tenant_id,
      author_id: user.id,
      theme: generated.theme || tema,
      objectives: generated.objectives,
      content: generated.content,
      suggested_activities: generated.suggestedActivities,
      suggested_assessments: generated.suggestedAssessments,
      ai_provider: provider.id,
    })
    .select("id")
    .single();

  if (insertError || !lessonPlan) {
    return NextResponse.json(
      { error: `Falha ao salvar o plano de aula: ${insertError?.message ?? "erro desconhecido"}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: lessonPlan.id });
}
