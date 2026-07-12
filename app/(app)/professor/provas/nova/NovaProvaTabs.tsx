"use client";

import { CreateModeTabs } from "@/components/CreateModeTabs";
import { ExamForm } from "./ExamForm";
import { BlankExamForm } from "./BlankExamForm";

export function NovaProvaTabs() {
  return (
    <CreateModeTabs
      aiLabel="Gerar com IA"
      aiDesc="A IA monta as questões a partir do assunto e nível informados — editáveis depois."
      blankLabel="Criar do zero"
      blankDesc="Comece com uma prova em branco e adicione as questões manualmente."
      aiForm={<ExamForm />}
      blankForm={<BlankExamForm />}
    />
  );
}
