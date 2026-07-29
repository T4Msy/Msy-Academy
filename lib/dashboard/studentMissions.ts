export type StudentMissionCompletionType = "visited" | "derived";

export type StudentMissionId =
  | "classes"
  | "tasks"
  | "materials"
  | "simulados"
  | "study-plan"
  | "flashcards"
  | "tutor"
  | "progress"
  | "profile";

export type StudentMission = {
  id: StudentMissionId;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  completionType: StudentMissionCompletionType;
};

export const STUDENT_MISSIONS: StudentMission[] = [
  {
    id: "classes",
    title: "Conheça suas turmas",
    description: "Veja as turmas das quais você participa e os conteúdos enviados pelos professores.",
    actionLabel: "Ver minhas turmas",
    href: "/aluno/turmas",
    completionType: "derived",
  },
  {
    id: "tasks",
    title: "Veja suas tarefas",
    description: "Acompanhe atividades, provas e prazos enviados pelos professores.",
    actionLabel: "Ver tarefas",
    href: "/aluno/tarefas",
    completionType: "derived",
  },
  {
    id: "materials",
    title: "Abra um material",
    description: "Consulte PDFs, documentos e outros conteúdos compartilhados pelas suas turmas.",
    actionLabel: "Ver materiais",
    href: "/aluno/materiais",
    completionType: "derived",
  },
  {
    id: "simulados",
    title: "Conheça os simulados",
    description: "Pratique seus conhecimentos e acompanhe seus resultados.",
    actionLabel: "Ver simulados",
    href: "/aluno/simulados",
    completionType: "visited",
  },
  {
    id: "study-plan",
    title: "Organize seus estudos",
    description: "Crie um plano para definir matérias, tarefas e horários.",
    actionLabel: "Criar plano",
    href: "/aluno/plano-de-estudos",
    completionType: "visited",
  },
  {
    id: "flashcards",
    title: "Conheça os flashcards",
    description: "Revise conteúdos com cartões de pergunta e resposta.",
    actionLabel: "Ver flashcards",
    href: "/aluno/flashcards",
    completionType: "derived",
  },
  {
    id: "tutor",
    title: "Converse com o Tutor IA",
    description: "Faça uma pergunta e receba ajuda para entender um conteúdo.",
    actionLabel: "Falar com o Tutor",
    href: "/aluno/tutor-ia",
    completionType: "visited",
  },
  {
    id: "progress",
    title: "Acompanhe seu progresso",
    description: "Veja suas notas, atividades concluídas e evolução nos estudos.",
    actionLabel: "Ver meu progresso",
    href: "/aluno/dashboard",
    completionType: "visited",
  },
  {
    id: "profile",
    title: "Complete seu perfil",
    description: "Confira seus dados e personalize sua conta.",
    actionLabel: "Ver perfil",
    href: "/aluno/perfil",
    completionType: "visited",
  },
];

export type StudentMissionDerivedContext = {
  hasClasses: boolean;
  hasTasks: boolean;
  hasMaterials: boolean;
  hasFlashcards: boolean;
};

export function getDerivedStudentMissionIds(context: StudentMissionDerivedContext): StudentMissionId[] {
  return [
    context.hasClasses && "classes",
    context.hasTasks && "tasks",
    context.hasMaterials && "materials",
    context.hasFlashcards && "flashcards",
  ].filter((id): id is StudentMissionId => Boolean(id));
}
