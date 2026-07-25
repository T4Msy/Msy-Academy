import { NextResponse } from "next/server";
import { activityGenerationSchema } from "@/lib/activities/schemas";
import { createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/ai/orchestrator";
import { getAIProvider } from "@/lib/ai/registry";
import { QuotaExceededError } from "@/lib/billing/quota";
import { ACTIVITY_GENERATION_SCHEMA_V1 } from "@/lib/ai/prompts/activity-generation.v1";
import type { GeneratedActivity } from "@/lib/ai/types";

export const runtime = "nodejs";

function failure(stage: string, code: string, error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[activity-generation]", { stage, code, message });
  return NextResponse.json({ error: { code, message: "Não foi possível concluir a criação da atividade." } }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sua sessão terminou. Entre novamente para continuar." } }, { status: 401 });

  let params: Record<string, unknown>;
  try { params = await request.json(); } catch (error) { return failure("payload", "INVALID_JSON", error, 400); }
  const schemaCheck = activityGenerationSchema.safeParse(params);
  if (!schemaCheck.success) return NextResponse.json({ error: { code: "INVALID_ACTIVITY_PAYLOAD", message: schemaCheck.error.issues[0]?.message ?? "Revise as informações preenchidas." } }, { status: 400 });

  const title = String(params.tituloprova ?? "").trim();
  const materia = String(params.materia ?? "").trim();
  if (!title && !materia) return NextResponse.json({ error: { code: "MISSING_ACTIVITY_TITLE", message: "Informe ao menos título ou matéria." } }, { status: 400 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (profileError || !profile) return failure("profile", "PROFILE_NOT_FOUND", profileError ?? new Error("Perfil não encontrado"));

  let generated: GeneratedActivity;
  try {
    generated = await generateStructured<GeneratedActivity>({ task: "ACTIVITY_GEN", schema: ACTIVITY_GENERATION_SCHEMA_V1, input: params, tenantId: profile.tenant_id, userId: user.id });
  } catch (error) {
    if (error instanceof QuotaExceededError) return NextResponse.json({ error: { code: "QUOTA_EXCEEDED", message: error.message } }, { status: 402 });
    return failure("generation", "AI_GENERATION_FAILED", error, 502);
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
  if (rpcError || !activityId) return failure("persistence", "ACTIVITY_PERSISTENCE_FAILED", rpcError ?? new Error("RPC sem id"));

  console.info("[activity-generation]", { stage: "response", code: "ACTIVITY_CREATED", activityId });
  return NextResponse.json({ id: activityId });
}
