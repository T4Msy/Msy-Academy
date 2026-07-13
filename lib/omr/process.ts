import { createAdminClient } from "@/lib/supabase/server";
import { decodeImageToPixels, locateAnswerSheet, readBubbleAnswers } from "./decode";

/**
 * Reads a scanned gabarito photo end-to-end: locate the QR (identifies the
 * student via answer_sheets), locate the 3 plain square corner markers,
 * compute a perspective transform back to the known template geometry
 * (lib/omr/layout.ts), then sample each bubble position for ink. Writes the
 * result onto answer_sheet_scans (status NEEDS_REVIEW on success, FAILED
 * with error_message otherwise) — never throws to the caller, since a bad
 * photo is an expected, recoverable outcome (the teacher re-shoots it), not
 * a server error.
 *
 * All the actual computer-vision/geometry logic lives in lib/omr/decode.ts,
 * which has no Supabase dependency and can be unit tested directly against
 * an image buffer; this file is just the Supabase I/O around it.
 */
export async function processScan(scanId: string): Promise<void> {
  const admin = createAdminClient();

  async function fail(message: string): Promise<void> {
    await admin.from("answer_sheet_scans").update({ status: "FAILED", error_message: message }).eq("id", scanId);
  }

  const { data: scan } = await admin
    .from("answer_sheet_scans")
    .select("id, assignment_id, storage_path")
    .eq("id", scanId)
    .single();
  if (!scan) return;

  try {
    const { data: fileBlob, error: downloadError } = await admin.storage
      .from("answer-sheet-scans")
      .download(scan.storage_path);
    if (downloadError || !fileBlob) throw new Error("Não foi possível baixar a imagem enviada.");

    const inputBuffer = Buffer.from(await fileBlob.arrayBuffer());
    const { pixels, width, height } = await decodeImageToPixels(inputBuffer);

    const located = locateAnswerSheet(pixels, width, height);
    if (!located.ok) throw new Error(located.error);
    const { qrData: answerSheetId, homography, sampleRadius } = located;

    const { data: answerSheet } = await admin
      .from("answer_sheets")
      .select("id, assignment_id, question_count")
      .eq("id", answerSheetId)
      .maybeSingle();
    if (!answerSheet) throw new Error("O QR code lido não corresponde a nenhuma folha de resposta conhecida.");
    if (answerSheet.assignment_id !== scan.assignment_id) {
      throw new Error("Este cartão pertence a uma prova diferente da selecionada para este escaneamento.");
    }

    const { data: assignmentRow } = await admin
      .from("assignments")
      .select("content_id")
      .eq("id", scan.assignment_id)
      .single();
    const { data: examQuestions } = await admin
      .from("exam_questions")
      .select("question_id, position")
      .eq("exam_id", assignmentRow?.content_id)
      .order("position");

    const questions = examQuestions ?? [];
    const readings = readBubbleAnswers(pixels, width, height, homography, sampleRadius, questions.length);

    const detectedAnswers: Record<string, string> = {};
    const confidence: Record<string, number> = {};
    questions.forEach((eq: { question_id: string; position: number }, questionIndex: number) => {
      const reading = readings[questionIndex];
      if (reading.letter) detectedAnswers[eq.question_id] = reading.letter;
      confidence[eq.question_id] = reading.confidence;
    });

    await admin
      .from("answer_sheet_scans")
      .update({ answer_sheet_id: answerSheetId, detected_answers: detectedAnswers, confidence, status: "NEEDS_REVIEW" })
      .eq("id", scanId);
  } catch (err) {
    await fail(err instanceof Error ? err.message : "Erro desconhecido ao processar a digitalização.");
  }
}
