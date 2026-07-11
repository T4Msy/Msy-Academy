import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createClient } from "@/lib/supabase/server";
import { buildExamParams } from "@/lib/exam/buildPayload";
import { generateStructured } from "@/lib/ai/orchestrator";
import { getAIProvider } from "@/lib/ai/registry";
import { QuotaExceededError } from "@/lib/billing/quota";
import { EXAM_GENERATION_SCHEMA_V1 } from "@/lib/ai/prompts/exam-generation.v1";
import type { GeneratedExam } from "@/lib/ai/types";

export const runtime = "nodejs";

const APOSTILA_MAX_CHARS = 12000; // enough context for question grounding without blowing up prompt size
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // "%PDF-" — see app/(app)/professor/biblioteca/actions.ts for the same check

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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let rawParams: Record<string, unknown> = {};
  let apostilaFile: File | null = null;
  try {
    const form = await request.formData();
    const dados = form.get("dados");
    if (typeof dados === "string") rawParams = JSON.parse(dados);
    const apostila = form.get("apostila");
    if (apostila instanceof File && apostila.size > 0) apostilaFile = apostila;
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

  const apostilaContent = params.usarapostila && apostilaFile ? await extractApostilaText(apostilaFile) : null;

  let generated: GeneratedExam;
  try {
    generated = await generateStructured<GeneratedExam>({
      task: "EXAM_GEN",
      schema: EXAM_GENERATION_SCHEMA_V1,
      input: apostilaContent ? { ...params, apostilaContent } : params,
      tenantId: profile.tenant_id,
      userId: user.id,
    });
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
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
