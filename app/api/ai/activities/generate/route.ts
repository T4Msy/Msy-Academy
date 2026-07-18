import { NextResponse } from "next/server";
import { activityGenerationSchema } from "@/lib/activities/schemas";
import { createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/ai/orchestrator";
import { getAIProvider } from "@/lib/ai/registry";
import { QuotaExceededError } from "@/lib/billing/quota";
import { ACTIVITY_GENERATION_SCHEMA_V1 } from "@/lib/ai/prompts/activity-generation.v1";
import type { GeneratedActivity } from "@/lib/ai/types";

export const runtime = "nodejs";

/** POST /api/ai/activities/generate — mirrors /api/ai/exams/generate (Fase 1), RF-P11. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sua sessão terminou. Entre novamente para continuar." }, { status: 401 });

  let params: Record<string, unknown>;
  try {
    params = await request.json();
  } catch {
    return NextResponse.json({ error: "Não conseguimos entender os dados enviados. Revise as informações e tente novamente." }, { status: 400 });
  }

  // Contrato único (decisão nº 9 do ADR 13): mesmo schema Zod do client
  // valida aqui antes dos usos — os checks manuais abaixo ficam como
  // salvaguarda de tipos para o código existente.
  const schemaCheck = activityGenerationSchema.safeParse(params);
  if (!schemaCheck.success) {
    return NextResponse.json(
      { error: schemaCheck.error.issues[0]?.message ?? "Revise as informações preenchidas e tente novamente." },
      { status: 400 },
    );
  }

  const title = String(params.tituloprova ?? "").trim();
  const materia = String(params.materia ?? "").trim();
  if (!title && !materia) {
    return NextResponse.json({ error: "Informe ao menos título ou matéria." }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Não encontramos seu perfil. Atualize a página e tente novamente." }, { status: 500 });

  let generated: GeneratedActivity;
  try {
    generated = await generateStructured<GeneratedActivity>({
      task: "ACTIVITY_GEN",
      schema: ACTIVITY_GENERATION_SCHEMA_V1,
      input: params,
      tenantId: profile.tenant_id,
      userId: user.id,
    });
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    return NextResponse.json({ error: "Não conseguimos criar a atividade agora. Tente novamente em alguns instantes." }, { status: 502 });
  }

  const provider = getAIProvider();

  const { data: activityId, error: rpcError } = await supabase.rpc("create_activity_with_questions", {
    p_title: title || materia || "Atividade sem título",
    p_subject_id: null,
    p_grade_level_id: null,
    p_generation_params: params,
    p_ai_provider: provider.id,
    p_questions: generated.questions,
  });

  if (rpcError || !activityId) {
    return NextResponse.json(
      { error: "A atividade foi criada, mas não conseguimos salvá-la. Tente novamente." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: activityId });
}
