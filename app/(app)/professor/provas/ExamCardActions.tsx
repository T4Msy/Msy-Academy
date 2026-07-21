"use client";

import { RenameDeleteMenu } from "@/components/shell/RenameDeleteMenu";
import { deleteExam, renameExam } from "./actions";

export function ExamCardActions({ examId, examTitle }: { examId: string; examTitle: string }) {
  return (
    <RenameDeleteMenu
      currentTitle={examTitle}
      onRename={(title) => renameExam(examId, title)}
      onDelete={() => deleteExam(examId)}
      redirectAfterDelete="/professor/provas"
      deleteConfirmLabel="Excluir esta prova? Ela deixará de aparecer na sua lista."
    />
  );
}
