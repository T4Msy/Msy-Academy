export type ExploreResourceId = "custom-exam" | "ai-activity" | "lesson-plan" | "question-bank" | "library" | "publish-activity" | "correct-submission" | "class-reports" | "profile" | "ai-correction";

export type ExploreResource = {
  id: ExploreResourceId;
  title: string;
  description: string;
  category: string;
  icon: string;
  href: string;
  completed: boolean;
};

export const EXPLORE_RESOURCE_DEFINITIONS = [
  { id: "custom-exam", title: "Criar uma prova personalizada", description: "Monte uma avaliação do seu jeito, com questões escolhidas por você.", category: "Avaliações", icon: "FileText", href: "/professor/provas/nova" },
  { id: "ai-activity", title: "Gerar uma atividade com IA", description: "Crie exercícios automaticamente a partir do assunto e nível da turma.", category: "Inteligência Artificial", icon: "Sparkles", href: "/professor/atividades/nova" },
  { id: "lesson-plan", title: "Criar um plano de aula", description: "Organize objetivos, conteúdos e atividades para sua próxima aula.", category: "Inteligência Artificial", icon: "ClipboardList", href: "/professor/planos-de-aula/nova" },
  { id: "question-bank", title: "Explorar o Banco de Questões", description: "Encontre questões e reaproveite o melhor do seu acervo.", category: "Biblioteca", icon: "LibraryBig", href: "/professor/banco-de-questoes" },
  { id: "library", title: "Explorar a Biblioteca", description: "Acesse provas, atividades, planos e materiais salvos.", category: "Biblioteca", icon: "BookOpen", href: "/professor/biblioteca" },
  { id: "publish-activity", title: "Publicar uma atividade para uma turma", description: "Compartilhe uma atividade com seus alunos e defina um prazo.", category: "Turmas", icon: "Send", href: "/professor/turmas" },
  { id: "correct-submission", title: "Corrigir uma entrega", description: "Revise as respostas dos alunos e acompanhe seu desenvolvimento.", category: "Avaliações", icon: "CheckCheck", href: "/professor/correcao" },
  { id: "class-reports", title: "Visualizar os relatórios da turma", description: "Veja o desempenho da turma e encontre oportunidades de intervenção.", category: "Turmas", icon: "ChartNoAxesCombined", href: "/professor/turmas" },
  { id: "profile", title: "Configurar seu perfil", description: "Personalize seus dados e deixe seu espaço com a sua cara.", category: "Sua conta", icon: "UserRound", href: "/professor/configuracoes" },
  { id: "ai-correction", title: "Utilizar o corretor por IA", description: "Acelere a correção de respostas discursivas com uma sugestão inteligente.", category: "Inteligência Artificial", icon: "Bot", href: "/professor/correcao" },
] as const;

export type ExploreResourceCounts = Record<ExploreResourceId, boolean>;

export function buildExploreResources(completed: ExploreResourceCounts): ExploreResource[] {
  return EXPLORE_RESOURCE_DEFINITIONS.map((resource) => ({ ...resource, completed: completed[resource.id] }));
}

export function getVisibleExploreResources(resources: ExploreResource[], visibleCount = 4): ExploreResource[] {
  const completed = resources.filter((resource) => resource.completed).length;
  return resources.slice(Math.max(0, completed - (visibleCount - 1)), Math.max(visibleCount, completed + 1));
}
