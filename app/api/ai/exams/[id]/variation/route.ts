import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStructured } from "@/lib/ai/orchestrator";
import { EXAM_GENERATION_SCHEMA_V1 } from "@/lib/ai/prompts/exam-generation.v1";
import { QuotaExceededError } from "@/lib/billing/quota";
import type { Question } from "@/lib/ai/types";
import {
  allVariationStatementsMatch,
  generatedExamVariationSchema,
} from "@/lib/exam/variation";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sua sessão terminou. Entre novamente para continuar." },
      { status: 401 },
    );

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, title, course, style, generation_params, include_answer_key, tenant_id, author_id")
    .eq("id", id)
    .single();

  if (examError || !exam)
    return NextResponse.json({ error: "Prova não encontrada." }, { status: 404 });
  if (exam.author_id !== user.id)
    return NextResponse.json(
      { error: "Você não tem permissão para gerar uma variação desta prova." },
      { status: 403 },
    );

  const { data: links, error: questionsError } = await supabase
    .from("exam_questions")
    .select(
      "position, points, questions(type, statement, options, correct_answer, explanation, difficulty, tags)",
    )
    .eq("exam_id", id)
    .order("position");

  if (questionsError || !links?.length)
    return NextResponse.json(
      { error: "Esta prova não possui questões para variar." },
      { status: 400 },
    );

  const originalQuestions = links.flatMap((link) => {
    const question = link.questions as unknown as Record<string, unknown> | null;
    return question
      ? [
          {
            type: question.type as Question["type"],
            statement: String(question.statement ?? ""),
            options: question.options as Question["options"],
            correctAnswer: question.correct_answer as Question["correctAnswer"],
            explanation: question.explanation as Question["explanation"],
            difficulty: question.difficulty as Question["difficulty"],
            tags: question.tags as Question["tags"],
            points: link.points,
          },
        ]
      : [];
  });

  try {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const generated = await generateStructured<unknown>({
        task: "EXAM_GEN",
        schema: EXAM_GENERATION_SCHEMA_V1,
        input: {
          ...((exam.generation_params as object) ?? {}),
          variationMode: true,
          variationAttempt: attempt,
          quantidade: originalQuestions.length,
          originalExam: {
            title: exam.title,
            course: exam.course,
            style: exam.style,
            questions: originalQuestions,
          },
        },
        tenantId: exam.tenant_id,
        userId: user.id,
      });
      const parsed = generatedExamVariationSchema.safeParse(generated);
      const preservesStructure =
        parsed.success &&
        parsed.data.questions.every((question, index) => {
          const original = originalQuestions[index];
          return question.type === original?.type && question.difficulty === original?.difficulty;
        });
      if (
        !parsed.success ||
        parsed.data.questions.length !== originalQuestions.length ||
        !preservesStructure
      ) {
        console.error(
          "Invalid exam variation response",
          parsed.success
            ? { expected: originalQuestions.length, received: parsed.data.questions.length }
            : parsed.error,
        );
        return NextResponse.json(
          { error: "A IA retornou uma variação inválida. Gere novamente." },
          { status: 422 },
        );
      }
      if (!allVariationStatementsMatch(originalQuestions, parsed.data.questions)) {
        return NextResponse.json(parsed.data);
      }
      console.warn("Exam variation matched every original statement", { examId: id, attempt });
    }
    return NextResponse.json(
      { error: "Não foi possível criar uma variação diferente após 3 tentativas. Tente novamente." },
      { status: 422 },
    );
  } catch (error) {
    console.error("Failed to generate exam variation", error);
    if (error instanceof QuotaExceededError)
      return NextResponse.json({ error: error.message }, { status: 402 });
    return NextResponse.json(
      { error: "Não conseguimos gerar a variação agora. Tente novamente em alguns instantes." },
      { status: 502 },
    );
  }
}
