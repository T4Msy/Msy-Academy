"use client";

import { CreateModeTabs } from "@/components/CreateModeTabs";
import { LessonPlanForm } from "./LessonPlanForm";
import { BlankLessonPlanForm } from "./BlankLessonPlanForm";

export function NovoPlanoTabs() {
  return (
    <CreateModeTabs
      aiLabel="Gerar com IA"
      aiDesc="A IA monta objetivos, conteúdo e avaliação a partir do tema informado — editáveis depois."
      blankLabel="Criar do zero"
      blankDesc="Escreva você mesmo cada seção do plano de aula."
      aiForm={<LessonPlanForm />}
      blankForm={<BlankLessonPlanForm />}
    />
  );
}
