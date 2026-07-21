import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import { createClient } from "@/lib/supabase/server";
import { buildExamParams } from "@/lib/exam/buildPayload";
import { examGenerationRequestSchema } from "@/lib/exam/schemas";
import { generateStructured } from "@/lib/ai/orchestrator";
import { AIProviderError } from "@/lib/ai/orchestrator";
import { getAIProvider } from "@/lib/ai/registry";
import { QuotaExceededError } from "@/lib/billing/quota";
import { EXAM_GENERATION_SCHEMA_V1 } from "@/lib/ai/prompts/exam-generation.v1";
import type { GeneratedExam } from "@/lib/ai/types";
import { generatedExamSchema } from "@/lib/exam/variation";

const nodeRequire = createRequire(import.meta.url);

export const runtime = "nodejs";

const APOSTILA_MAX_CHARS = 12000; // enough context for question grounding without blowing up prompt size
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // "%PDF-" — see app/(app)/professor/biblioteca/actions.ts for the same check
const isDevelopment = process.env.NODE_ENV === "development";

function devLog(message: string, details?: Record<string, unknown>) {
  if (isDevelopment) console.info(`[exams/generate] ${message}`, details ?? {});
}

function logFailure(message: string, error: unknown, details?: Record<string, unknown>) {
  if (!isDevelopment) return;
  console.error(`[exams/generate] ${message}`, {
    ...details,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    cause: error instanceof Error ? error.cause : undefined,
  });
}

function sanitizedPayload(payload: Record<string, unknown>) {
  const { observacoesprofessor, ...safe } = payload;
  return {
    ...safe,
    observacoesprofessor: typeof observacoesprofessor === "string" && observacoesprofessor ? "[preenchido]" : undefined,
  };
}

async function isRealPdf(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, PDF_MAGIC.length).arrayBuffer());
  return PDF_MAGIC.every((byte, i) => head[i] === byte);
}

/**
 * Best-effort apostila text extraction — supplementary material, not a
 * required input. Any failure (not a real PDF, scanned/image-only PDF with
 * no text layer, corrupt file) degrades to "no apostila context" rather
 * than failing the whole generation; the professor shouldn't lose their
 * exam over an unparseable attachment.
 */
async function extractApostilaText(file: File): Promise<string | null> {
  try {
    if (!(await isRealPdf(file))) return null;
    const { PDFParse } = nodeRequire("pdf-parse") as typeof import("pdf-parse");
    const arrayBuffer = await file.arrayBuffer();
    const parser = new PDFParse({ data: arrayBuffer });
    const { text } = await parser.getText();
    const clean = text.replace(/\s+/g, " ").trim();
    return clean ? clean.slice(0, APOSTILA_MAX_CHARS) : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/ai/exams/generate
 *
 * Fase 1: substitui o antigo POST /api/exams/generate (n8n → HTML cru, DT-06).
 * A IA agora retorna dados estruturados via lib/ai/orchestrator, e a
 * persistência de exam+questions+exam_questions acontece atomicamente na
 * função de banco `create_exam_with_questions` (migration 0006) — RLS
 * continua sendo o cliente autenticado do usuário, não um bypass.
 *
 * Upload de apostila (PDF, US-2.3): quando presente e "usar apostila" está
 * ligado, o texto é extraído e passado à IA como `apostilaContent` — não é
 * persistido em generation_params (só o flag usarapostila já registrado ali
 * continua a fonte da verdade de "essa prova usou apostila").
 */
export async function POST(request: Request) {
  devLog("Início da requisição");
  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    logFailure("Falha ao criar cliente Supabase", error, { stage: "supabase-client" });
    return NextResponse.json(
      { error: "Não conseguimos iniciar a geração. Tente novamente." },
      { status: 500 },
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    if (authError)
      logFailure("Falha ao autenticar usuário", authError, { stage: "authentication" });
    return NextResponse.json(
      { error: "Sua sessão terminou. Entre novamente para continuar." },
      { status: 401 },
    );
  }
  devLog("Usuário autenticado", { userId: user.id });

  let rawParams: Record<string, unknown> = {};
  let apostilaFile: File | null = null;
  try {
    const form = await request.formData();
    const dados = form.get("dados");
    if (typeof dados === "string") rawParams = JSON.parse(dados);
    const apostila = form.get("apostila");
    if (apostila instanceof File && apostila.size > 0) apostilaFile = apostila;
  } catch (error) {
    logFailure("Payload ilegível", error, { stage: "body-parsing" });
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        message: "Não conseguimos entender os dados enviados.",
        fieldErrors: {},
        formErrors: ["O corpo da requisição não contém um JSON válido."],
      },
      { status: 400 },
    );
  }

  // Contrato único (decisão nº 9 do ADR 13): mesmo schema do client valida
  // aqui antes da normalização — substitui os checks manuais por campo.
  const parsed = examGenerationRequestSchema.safeParse(rawParams);
  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    devLog("Payload inválido", {
      success: parsed.success,
      fieldErrors,
      formErrors,
      payload: sanitizedPayload(rawParams),
    });
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        message: "Alguns dados da prova são inválidos.",
        fieldErrors,
        formErrors,
      },
      { status: 400 },
    );
  }

  const params = buildExamParams(
    parsed.data as unknown as Record<string, string | boolean | number>,
  );
  devLog("Payload validado", {
    questionCount: params.quantidade,
    type: params.tipo,
    difficulty: params.nivel,
    hasAttachment: Boolean(apostilaFile),
  });

  const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] =
    await Promise.all([
      supabase.from("profiles").select("tenant_id").eq("id", user.id).single(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);

  if (profileError || !profile) {
    logFailure("Falha ao consultar perfil", profileError, {
      stage: "profile",
      userId: user.id,
      code: profileError?.code,
      details: profileError?.details,
      hint: profileError?.hint,
    });
    return NextResponse.json(
      { error: "Não encontramos seu perfil. Atualize a página e tente novamente." },
      { status: 500 },
    );
  }
  if (rolesError) {
    logFailure("Falha ao consultar função", rolesError, {
      stage: "authorization",
      userId: user.id,
      code: rolesError.code,
      details: rolesError.details,
      hint: rolesError.hint,
    });
    return NextResponse.json(
      { error: "Não conseguimos verificar sua permissão. Tente novamente." },
      { status: 500 },
    );
  }
  if (!roles?.some(({ role }) => role === "PROFESSOR" || role === "ADMIN")) {
    return NextResponse.json(
      { error: "Você não tem permissão para gerar provas." },
      { status: 403 },
    );
  }

  const apostilaContent =
    params.usarapostila && apostilaFile ? await extractApostilaText(apostilaFile) : null;

  let generated: GeneratedExam;
  let provider;
  try {
    provider = getAIProvider();
    devLog("Provider selecionado", { provider: provider.id, metered: provider.metered !== false });
    generated = await generateStructured<GeneratedExam>({
      task: "EXAM_GEN",
      schema: EXAM_GENERATION_SCHEMA_V1,
      input: apostilaContent ? { ...params, apostilaContent } : params,
      tenantId: profile.tenant_id,
      userId: user.id,
    });
  } catch (err) {
    logFailure("Falha durante geração", err, {
      stage: err instanceof AIProviderError ? "provider" : "orchestrator",
      provider: provider?.id,
    });
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: err.message, code: "AI_QUOTA_EXCEEDED" }, { status: 429 });
    }
    if (err instanceof AIProviderError && provider?.metered !== false)
      return NextResponse.json(
        { error: "O serviço de IA não conseguiu gerar a prova. Tente novamente." },
        { status: 502 },
      );
    return NextResponse.json(
      { error: "Não conseguimos processar a geração agora. Tente novamente." },
      { status: 500 },
    );
  }

  devLog("Resultado recebido do provider", {
    provider: provider.id,
    questionCount: generated.questions?.length,
    hasTitle: Boolean(generated.title),
  });
  const validatedOutput = generatedExamSchema.safeParse(generated);
  if (!validatedOutput.success || validatedOutput.data.questions.length !== params.quantidade) {
    devLog("Resposta inválida do provider", {
      provider: provider.id,
      issueCount: validatedOutput.success ? 1 : validatedOutput.error.issues.length,
      expectedQuestions: params.quantidade,
      receivedQuestions: validatedOutput.success
        ? validatedOutput.data.questions.length
        : undefined,
    });
    const status = provider.metered === false ? 500 : 502;
    return NextResponse.json(
      { error: "O serviço de IA retornou uma prova inválida. Tente novamente." },
      { status },
    );
  }
  generated = validatedOutput.data;
  devLog("Resultado validado", { questionCount: generated.questions.length });

  devLog("Início da gravação no banco", {
    provider: provider.id,
    questionCount: generated.questions.length,
  });
  let rpcResult;
  try {
    rpcResult = await supabase.rpc("create_exam_with_questions", {
      p_title: params.tituloprova || params.materia || "Prova sem título",
      p_course: params.curso || null,
      p_style: params.estilo || null,
      p_generation_params: params,
      p_include_answer_key: params.incluirgabarito,
      p_ai_provider: provider.id,
      p_questions: generated.questions,
    });
  } catch (error) {
    logFailure("Exceção ao salvar prova", error, { stage: "database" });
    return NextResponse.json(
      { error: "Não conseguimos salvar a prova. Tente novamente." },
      { status: 500 },
    );
  }
  const { data: examId, error: rpcError } = rpcResult;

  if (rpcError || !examId) {
    logFailure("Falha ao salvar prova", rpcError ?? new Error("RPC não retornou o id da prova"), {
      stage: "database",
      code: rpcError?.code,
      details: rpcError?.details,
      hint: rpcError?.hint,
    });
    return NextResponse.json(
      { error: "A prova foi criada, mas não conseguimos salvá-la. Tente novamente." },
      { status: 500 },
    );
  }

  devLog("Prova salva", { examId });
  return NextResponse.json({ id: examId });
}
