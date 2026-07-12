"use client";

import { CreateModeTabs } from "@/components/CreateModeTabs";
import { ActivityForm } from "./ActivityForm";
import { BlankActivityForm } from "./BlankActivityForm";

export function NovaAtividadeTabs() {
  return (
    <CreateModeTabs
      aiLabel="Gerar com IA"
      aiDesc="A IA monta os exercícios a partir do assunto e nível informados — editáveis depois."
      blankLabel="Criar do zero"
      blankDesc="Comece com uma atividade em branco e adicione as questões manualmente."
      aiForm={<ActivityForm />}
      blankForm={<BlankActivityForm />}
    />
  );
}
