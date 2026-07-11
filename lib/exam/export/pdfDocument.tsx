import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ExportExam } from "./types";

/**
 * Real PDF generation from structured question data (@react-pdf/renderer),
 * replacing the CDN-loaded html2pdf.js (DT-10) — no network dependency at
 * export time, and no HTML string ever gets parsed/rendered from AI output
 * (RNF-S07, resolved by construction since Fase 1 stores structured data).
 */

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 12 },
  question: { marginBottom: 14 },
  questionHeader: { fontWeight: 700, marginBottom: 4 },
  statement: { marginBottom: 6, lineHeight: 1.4 },
  option: { marginLeft: 12, marginBottom: 2 },
  answerKeyTitle: { fontSize: 14, fontWeight: 700, marginTop: 24, marginBottom: 8 },
  answerKeyRow: { marginBottom: 3 },
});

function optionLine(id: string, text: string) {
  return `${id}) ${text}`;
}

export function ExamPdfDocument({ exam }: { exam: ExportExam }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{exam.title || "Prova"}</Text>

        {exam.questions.map((q, i) => (
          <View key={q.id} style={styles.question} wrap={false}>
            <Text style={styles.questionHeader}>Questão {i + 1}</Text>
            <Text style={styles.statement}>{q.statement}</Text>
            {q.type !== "DISCURSIVA" &&
              q.options?.map((opt) => (
                <Text key={opt.id} style={styles.option}>
                  {optionLine(opt.id, opt.text)}
                </Text>
              ))}
            {q.type === "DISCURSIVA" && <Text style={styles.option}>{"_".repeat(60)}</Text>}
          </View>
        ))}

        {exam.includeAnswerKey && (
          <View wrap={false}>
            <Text style={styles.answerKeyTitle}>Gabarito</Text>
            {exam.questions.map((q, i) => (
              <Text key={q.id} style={styles.answerKeyRow}>
                {i + 1}.{" "}
                {Array.isArray(q.correct_answer) ? q.correct_answer.join(", ") : q.correct_answer}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
