"use client";

import { useRouter } from "next/navigation";
import { RenameDeleteMenu } from "@/components/shell/RenameDeleteMenu";
import { renameExam, duplicateExamVersion, deleteExam } from "../actions";

export function ExamHeaderMenu({ examId, examTitle }: { examId: string; examTitle: string }) {
  const router = useRouter();

  return (
    <RenameDeleteMenu
      currentTitle={examTitle}
      onRename={(title) => renameExam(examId, title)}
      onDelete={() => deleteExam(examId)}
      redirectAfterDelete="/professor/provas"
      deleteConfirmLabel="Excluir esta prova?"
      extraActions={[
        {
          label: "Gerar versão B",
          pendingLabel: "Gerando versão B…",
          onRun: async () => {
            const newId = await duplicateExamVersion(examId);
            router.push(`/professor/provas/${newId}`);
          },
        },
      ]}
    />
  );
}
