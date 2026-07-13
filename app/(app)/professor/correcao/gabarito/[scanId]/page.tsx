import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { GabaritoReview, type ReviewQuestion } from "./GabaritoReview";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Revisar Gabarito" };

export default async function RevisarGabaritoPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  const supabase = await createClient();

  const { data: scan } = await supabase
    .from("answer_sheet_scans")
    .select("id, assignment_id, storage_path, detected_answers, confidence, status, error_message")
    .eq("id", scanId)
    .single();
  if (!scan) notFound();

  const [{ data: assignment }, { data: signedUrl }] = await Promise.all([
    supabase.from("assignments").select("class_id, content_id").eq("id", scan.assignment_id).single(),
    supabase.storage.from("answer-sheet-scans").createSignedUrl(scan.storage_path, 300),
  ]);

  const [{ data: klass }, { data: examQuestions }] = await Promise.all([
    assignment ? supabase.from("classes").select("name").eq("id", assignment.class_id).single() : Promise.resolve({ data: null }),
    assignment
      ? supabase.from("exam_questions").select("question_id, position").eq("exam_id", assignment.content_id).order("position")
      : Promise.resolve({ data: [] }),
  ]);

  const questionIds = (examQuestions ?? []).map((eq) => eq.question_id);
  const { data: questions } = questionIds.length
    ? await supabase.from("questions").select("id, statement, options").in("id", questionIds)
    : { data: [] as { id: string; statement: string; options: { id: string; text: string }[] | null }[] };
  const questionById = new Map((questions ?? []).map((q) => [q.id, q]));

  const detectedAnswers = (scan.detected_answers ?? {}) as Record<string, string>;
  const confidence = (scan.confidence ?? {}) as Record<string, number>;

  const reviewQuestions: ReviewQuestion[] = (examQuestions ?? []).map((eq, i) => {
    const q = questionById.get(eq.question_id);
    return {
      questionId: eq.question_id,
      position: i + 1,
      statement: q?.statement ?? "Questão não encontrada",
      options: q?.options ?? [],
      detectedLetter: detectedAnswers[eq.question_id] ?? null,
      confidence: confidence[eq.question_id] ?? 0,
    };
  });

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/professor/correcao" className="sidebar-link back-link">
            ← Correção
          </Link>
          <h1 className="page-title">Revisar cartão-resposta</h1>
          <p className="page-subtitle">Turma: {klass?.name ?? ""}</p>
        </div>
      </div>

      {scan.status === "FAILED" && (
        <div className="notice notice--error">
          <p className="text-strong mt-0">Não foi possível processar este cartão.</p>
          <p className="mt-0">{scan.error_message}</p>
          <Link href={`/professor/correcao/escanear/${scan.assignment_id}`} className="btn btn-primary btn-sm">
            Escanear novamente
          </Link>
        </div>
      )}

      {scan.status === "CONFIRMED" && (
        <div className="notice">
          <p className="text-strong mt-0">Este cartão já foi confirmado.</p>
        </div>
      )}

      {scan.status === "NEEDS_REVIEW" && (
        <GabaritoReview scanId={scan.id} photoUrl={signedUrl?.signedUrl ?? null} questions={reviewQuestions} />
      )}
    </>
  );
}
