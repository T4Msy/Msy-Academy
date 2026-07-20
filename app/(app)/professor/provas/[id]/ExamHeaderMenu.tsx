"use client";

import { RenameDeleteMenu } from "@/components/shell/RenameDeleteMenu";
import { renameExam, deleteExam } from "../actions";

export function ExamHeaderMenu({ examId, examTitle }: { examId: string; examTitle: string }) {
  return (
    <RenameDeleteMenu
      currentTitle={examTitle}
      onRename={(title) => renameExam(examId, title)}
      onDelete={() => deleteExam(examId)}
      redirectAfterDelete="/professor/provas"
      deleteConfirmLabel="Excluir esta prova?"
    />
  );
}
