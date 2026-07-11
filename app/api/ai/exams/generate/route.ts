import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildExamParams } from "@/lib/exam/buildPayload";
import { generateStructured } from "@/lib/ai/orchestrator";
import { getAIProvider } from "@/lib/ai/registry";
import { EXAM_GENERATION_SCHEMA_V1 } from "@/lib/ai/prompts/exam-generation.v1";
import type { GeneratedExam } from "@/lib/ai/types";

export const runtime = "nodejs";

/**
 * POST /api/ai/exams/generate
 *
 * Fase 1: substitui o antigo POST /api/exams/generate (n8n → HTML cru, DT-06).
 * A IA agora retorna dados estruturados via lib/ai/orchestrator, e a
 * persistência de exam+questions+exam_questions acontece atomicamente na
 * função de banco `create_exam_with_questions` (migration 0006) — RLS
 * continua sendo o cliente autenticado do usuário, não um bypass.
 *
 * Upload de apostila (PDF) ainda é aceito no formulário mas não é usado pelo
 * provider ainda — extração de texto/RAG fica para a Fase 4 (ver plano).
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let rawParams: Record<string, unknown> = {};
  try {
    const form = await request.formData();
    const dados = form.get("dados");
    if (typeof dados === "string") rawParams = JSON.parse(dados);
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const params = buildExamParams(rawParams as Record<string, string | boolean | number>);

  if (!params.tituloprova && !params.materia && !params.assunto) {
    return NextResponse.json(
      { error: "Informe ao menos título, matéria ou assunto." },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 500 });
  }

  let generated: GeneratedExam;
  try {
    generated = await generateStructured<GeneratedExam>({
      task: "EXAM_GEN",
      schema: EXAM_GENERATION_SCHEMA_V1,
      input: params,
      tenantId: profile.tenant_id,
      userId: user.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Falha ao gerar a prova: ${message}` }, { status: 502 });
  }

  const provider = getAIProvider();

  const { data: examId, error: rpcError } = await supabase.rpc("create_exam_with_questions", {
    p_title: params.tituloprova || params.materia || "Prova sem título",
    p_course: params.curso || null,
    p_style: params.estilo || null,
    p_generation_params: params,
    p_include_answer_key: params.incluirgabarito,
    p_ai_provider: provider.id,
    p_questions: generated.questions,
  });

  if (rpcError || !examId) {
    return NextResponse.json(
      { error: `Falha ao salvar a prova: ${rpcError?.message ?? "erro desconhecido"}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: examId });
}
