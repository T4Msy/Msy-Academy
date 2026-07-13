import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import {
  MARGIN_PT,
  MARKERS,
  OPTION_LETTERS,
  GRID_TOP_PT,
  ROW_HEIGHT_PT,
  QUESTION_LABEL_X_PT,
  bubbleBox,
} from "@/lib/omr/layout";

/**
 * Printable "gabarito" (bubble answer sheet) — generated server-side (not in
 * the browser like ExamPdfDocument) so the QR/marker coordinates baked into
 * this file and the ones lib/omr/process.ts expects when reading a photo of
 * the printed sheet never drift out of sync; see lib/omr/layout.ts.
 */

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: "Helvetica" },
  header: {
    position: "absolute",
    left: MARGIN_PT + MARKERS.qr.size + 16,
    top: MARGIN_PT,
    right: MARGIN_PT + MARKERS.topRight.size + 16,
  },
  headerTitle: { fontSize: 13, fontWeight: 700, marginBottom: 3 },
  headerLine: { fontSize: 9.5, color: "#333", marginBottom: 2 },
  marker: { position: "absolute", backgroundColor: "#000" },
  qrImage: { position: "absolute" },
  instructions: {
    position: "absolute",
    left: MARGIN_PT,
    top: MARGIN_PT + MARKERS.qr.size + 10,
    right: MARGIN_PT,
    fontSize: 8.5,
    color: "#444",
  },
  columnHeader: { position: "absolute", top: GRID_TOP_PT - 16, fontSize: 8.5, fontWeight: 700, color: "#555" },
  questionLabel: { position: "absolute", left: QUESTION_LABEL_X_PT, fontSize: 10, fontWeight: 700 },
  bubble: { position: "absolute", borderWidth: 1.2, borderColor: "#000" },
});

export interface GabaritoDocumentProps {
  qrDataUrl: string;
  examTitle: string;
  className: string;
  studentName: string;
  questionCount: number;
}

export function GabaritoDocument({ qrDataUrl, examTitle, className, studentName, questionCount }: GabaritoDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image src={qrDataUrl} style={{ ...styles.qrImage, left: MARKERS.qr.x, top: MARKERS.qr.y, width: MARKERS.qr.size, height: MARKERS.qr.size }} />
        <View style={{ ...styles.marker, left: MARKERS.topRight.x, top: MARKERS.topRight.y, width: MARKERS.topRight.size, height: MARKERS.topRight.size }} />
        <View style={{ ...styles.marker, left: MARKERS.bottomLeft.x, top: MARKERS.bottomLeft.y, width: MARKERS.bottomLeft.size, height: MARKERS.bottomLeft.size }} />
        <View style={{ ...styles.marker, left: MARKERS.bottomRight.x, top: MARKERS.bottomRight.y, width: MARKERS.bottomRight.size, height: MARKERS.bottomRight.size }} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>{examTitle || "Prova"}</Text>
          <Text style={styles.headerLine}>Turma: {className}</Text>
          <Text style={styles.headerLine}>Aluno: {studentName}</Text>
        </View>

        <Text style={styles.instructions}>
          Preencha completamente o círculo correspondente à resposta certa, usando caneta escura. Não amasse, dobre
          nem rasure esta folha — os marcadores nos cantos são necessários para a correção automática.
        </Text>

        {OPTION_LETTERS.map((letter, optionIndex) => {
          const box = bubbleBox(0, optionIndex);
          return (
            <Text key={letter} style={{ ...styles.columnHeader, left: box.x }}>
              {letter}
            </Text>
          );
        })}

        {Array.from({ length: questionCount }).map((_, questionIndex) => (
          <View key={questionIndex}>
            <Text style={{ ...styles.questionLabel, top: GRID_TOP_PT + questionIndex * ROW_HEIGHT_PT }}>
              {questionIndex + 1}
            </Text>
            {OPTION_LETTERS.map((letter, optionIndex) => {
              const box = bubbleBox(questionIndex, optionIndex);
              return (
                <View
                  key={letter}
                  style={{
                    ...styles.bubble,
                    left: box.x,
                    top: box.y,
                    width: box.size,
                    height: box.size,
                    borderRadius: box.size / 2,
                  }}
                />
              );
            })}
          </View>
        ))}
      </Page>
    </Document>
  );
}
