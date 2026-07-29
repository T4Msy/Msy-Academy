export type LearningStage = "material" | "task" | "flashcards" | "simulado" | "plan";

export type LearningAction = { href: string; label: string };

export type LearningNextStep = {
  title: string;
  description: string;
  primary: LearningAction;
  secondary: LearningAction[];
};

export function getNextStep({ stage, materialId, deckId }: { stage: LearningStage; materialId?: string; deckId?: string }): LearningNextStep {
  if (stage === "material") {
    return {
      title: "Continue estudando este conteúdo",
      description: "Transforme a leitura em uma revisão prática.",
      primary: { href: materialId ? `/aluno/flashcards?materialIds=${materialId}` : "/aluno/flashcards", label: "Revisar" },
      secondary: [{ href: "/aluno/tutor-ia", label: "Perguntar" }],
    };
  }
  if (stage === "flashcards") {
    return {
      title: "Depois da revisão",
      description: "Faça um teste curto para conferir o que ficou.",
      primary: { href: "/aluno/simulados", label: "Simulado" },
      secondary: [
        ...(deckId ? [{ href: `/aluno/flashcards/${deckId}`, label: "Revisar" }] : []),
        { href: "/aluno/tutor-ia", label: "Perguntar" },
      ],
    };
  }
  if (stage === "simulado") {
    return {
      title: "Transforme o resultado em progresso",
      description: "Revise os erros e escolha como reforçar os temas mais difíceis.",
      primary: { href: "#resultado", label: "Revisar erros" },
      secondary: [{ href: "/aluno/plano-de-estudos", label: "Planejar" }, { href: "/aluno/tutor-ia", label: "Perguntar" }],
    };
  }
  if (stage === "task") {
    return {
      title: "Continue a partir deste resultado",
      description: "Use o que você acabou de descobrir para orientar a próxima revisão.",
      primary: { href: "/aluno/plano-de-estudos", label: "Planejar" },
      secondary: [{ href: "/aluno/simulados", label: "Simulado" }],
    };
  }
  return {
    title: "Continue seu plano",
    description: "Use o próximo item como ponto de partida para uma sessão de revisão.",
    primary: { href: "/aluno/flashcards", label: "Continuar" },
    secondary: [{ href: "/aluno/tutor-ia", label: "Perguntar" }],
  };
}
