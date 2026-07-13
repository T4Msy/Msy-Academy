import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { GabaritoDocument, type GabaritoSheetData } from "@/lib/exam/export/gabaritoDocument";

/**
 * Generates the printable gabarito PDF for an EXAM assignment — one page per
 * actively enrolled student, each with its own QR code encoding a stable
 * `answer_sheets.id` (migration 0022). Ensures an answer_sheets row exists
 * per student first (idempotent — re-downloading the same assignment's
 * gabarito reuses the same sheet ids, so a scan taken from an
 * already-printed sheet stays valid even if this route is called again).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, class_id, content_type, content_id")
    .eq("id", assignmentId)
    .single();
  if (!assignment || assignment.content_type !== "EXAM") {
    return NextResponse.json({ error: "Atribuição inválida ou não é uma prova." }, { status: 404 });
  }

  const [{ data: profile }, { data: klass }, { data: exam }, { count: questionCount }] = await Promise.all([
    supabase.from("profiles").select("tenant_id").eq("id", user.id).single(),
    supabase.from("classes").select("name").eq("id", assignment.class_id).single(),
    supabase.from("exams").select("title").eq("id", assignment.content_id).single(),
    supabase
      .from("exam_questions")
      .select("question_id", { count: "exact", head: true })
      .eq("exam_id", assignment.content_id),
  ]);
  if (!profile) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 400 });
  if (!questionCount) return NextResponse.json({ error: "Esta prova não tem questões." }, { status: 400 });

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id")
    .eq("class_id", assignment.class_id)
    .eq("status", "ACTIVE");
  const studentIds = (enrollments ?? []).map((e) => e.student_id);
  if (studentIds.length === 0) {
    return NextResponse.json({ error: "Nenhum aluno matriculado nesta turma ainda." }, { status: 400 });
  }

  const { data: studentProfiles } = await supabase.from("profiles").select("id, full_name").in("id", studentIds);
  const nameById = new Map((studentProfiles ?? []).map((p) => [p.id, p.full_name]));

  const { error: upsertError } = await supabase.from("answer_sheets").upsert(
    studentIds.map((studentId) => ({
      tenant_id: profile.tenant_id,
      assignment_id: assignmentId,
      student_id: studentId,
      question_count: questionCount,
    })),
    { onConflict: "assignment_id,student_id", ignoreDuplicates: true },
  );
  if (upsertError) {
    return NextResponse.json({ error: `Não foi possível preparar as folhas: ${upsertError.message}` }, { status: 500 });
  }

  const { data: sheets, error: sheetsError } = await supabase
    .from("answer_sheets")
    .select("id, student_id")
    .eq("assignment_id", assignmentId)
    .in("student_id", studentIds);
  if (sheetsError || !sheets?.length) {
    return NextResponse.json({ error: "Não foi possível carregar as folhas de resposta." }, { status: 500 });
  }

  const sheetData: GabaritoSheetData[] = await Promise.all(
    sheets.map(async (sheet) => ({
      answerSheetId: sheet.id,
      qrDataUrl: await QRCode.toDataURL(sheet.id, { margin: 1, width: 300 }),
      examTitle: exam?.title ?? "Prova",
      className: klass?.name ?? "",
      studentName: nameById.get(sheet.student_id) ?? "Aluno",
      questionCount: questionCount!,
    })),
  );

  const pdfBuffer = await renderToBuffer(<GabaritoDocument sheets={sheetData} />);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="gabarito-${assignmentId}.pdf"`,
    },
  });
}
