import { NextResponse } from "next/server";
import { studyPlanGenerationSchema } from "@/lib/study-plans/schemas";
import { createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/ai/orchestrator";
import { STUDY_PLAN_SCHEMA_V1 } from "@/lib/ai/prompts/study-plan.v1";
import { QuotaExceededError } from "@/lib/billing/quota";
import type { GeneratedStudyPlan } from "@/lib/ai/types";

export const runtime = "nodejs";

/** POST /api/ai/study-plan/generate — RF-A07. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sua sessão terminou. Entre novamente para continuar." }, { status: 401 });

  let params: { goal?: string; examDate?: string; availability?: Record<string, number> };
  try {
    params = await request.json();
  } catch {
    return NextResponse.json({ error: "Não conseguimos entender os dados enviados. Revise as informações e tente novamente." }, { status: 400 });
  }

  // Contrato único (decisão nº 9 do ADR 13): mesmo schema Zod do client
  // valida aqui antes dos usos — os checks manuais abaixo ficam como
  // salvaguarda de tipos para o código existente.
  const schemaCheck = studyPlanGenerationSchema.safeParse(params);
  if (!schemaCheck.success) {
    return NextResponse.json(
      { error: schemaCheck.error.issues[0]?.message ?? "Revise as informações preenchidas e tente novamente." },
      { status: 400 },
    );
  }

  const goal = (params.goal ?? "").trim();
  if (!goal) return NextResponse.json({ error: "Informe seu objetivo." }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Não encontramos seu perfil. Atualize a página e tente novamente." }, { status: 500 });

  let generated: GeneratedStudyPlan;
  try {
    generated = await generateStructured<GeneratedStudyPlan>({
      task: "STUDY_PLAN",
      schema: STUDY_PLAN_SCHEMA_V1,
      input: params,
      tenantId: profile.tenant_id,
      userId: user.id,
    });
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    return NextResponse.json({ error: "Não conseguimos criar o plano agora. Tente novamente em alguns instantes." }, { status: 502 });
  }

  const { data: plan, error: planErr } = await supabase
    .from("study_plans")
    .insert({
      tenant_id: profile.tenant_id,
      student_id: user.id,
      goal,
      exam_date: params.examDate || null,
      availability: params.availability ?? {},
    })
    .select("id")
    .single();
  if (planErr || !plan) {
    return NextResponse.json({ error: "O plano foi criado, mas não conseguimos salvá-lo. Tente novamente." }, { status: 500 });
  }

  if (generated.items.length > 0) {
    const rows = generated.items.map((item) => ({
      study_plan_id: plan.id,
      item_date: item.date,
      topic: item.topic,
      item_type: item.type,
    }));
    const { error: itemsErr } = await supabase.from("study_plan_items").insert(rows);
    if (itemsErr) {
      return NextResponse.json({ error: "Não conseguimos salvar as etapas do plano. Tente novamente." }, { status: 500 });
    }
  }

  return NextResponse.json({ id: plan.id });
}
