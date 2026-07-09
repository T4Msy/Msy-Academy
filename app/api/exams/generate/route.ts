import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildExamParams } from "@/lib/exam/buildPayload";
import { extractHtmlProva } from "@/lib/exam/extractHtml";

export const runtime = "nodejs";

/**
 * POST /api/exams/generate
 *
 * Authenticated exam generation. The browser posts the form values (and an
 * optional PDF) here; THIS server route — never the browser — calls the n8n
 * webhook, so the webhook URL and provider secrets stay server-side. The
 * generated exam is persisted (scoped to the caller's tenant by RLS) and its
 * id is returned for the client to navigate to.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "N8N_WEBHOOK_URL não configurado no servidor." },
      { status: 500 },
    );
  }

  // Accept multipart form data: `dados` (JSON) + optional `apostila` (PDF).
  let rawParams: Record<string, unknown> = {};
  let apostila: File | null = null;
  try {
    const form = await request.formData();
    const dados = form.get("dados");
    if (typeof dados === "string") rawParams = JSON.parse(dados);
    const file = form.get("apostila");
    if (file instanceof File && file.size > 0) apostila = file;
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

  // ── Call n8n server-side (embryo of the AI Orchestration Service) ──────────
  let html: string;
  try {
    const outbound = new FormData();
    outbound.append("dados", JSON.stringify(params));
    if (apostila) outbound.append("apostila", apostila);

    const res = await fetch(webhookUrl, { method: "POST", body: outbound });
    const contentType = res.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      const preview = await res.text();
      throw new Error(
        `Servidor de IA retornou ${res.status} (não-JSON). Trecho: ${preview.slice(0, 200)}`,
      );
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `Servidor de IA retornou ${res.status}. ${data?.message ?? data?.error ?? "sem detalhes"}`,
      );
    }

    html = extractHtmlProva(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // ── Persist (RLS scopes it to the caller's tenant) ─────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "Perfil não encontrado para o usuário." },
      { status: 500 },
    );
  }

  const { data: exam, error: insertError } = await supabase
    .from("exams")
    .insert({
      tenant_id: profile.tenant_id,
      author_id: user.id,
      title: params.tituloprova || params.materia || "Prova sem título",
      course: params.curso || null,
      style: params.estilo || null,
      generation_params: params,
      generated_html: html,
      include_answer_key: params.incluirgabarito,
      status: "READY",
      ai_provider: params.ia || null,
    })
    .select("id")
    .single();

  if (insertError || !exam) {
    return NextResponse.json(
      { error: `Falha ao salvar a prova: ${insertError?.message ?? "desconhecida"}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: exam.id });
}
