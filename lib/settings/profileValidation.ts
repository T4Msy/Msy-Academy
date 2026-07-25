export const PROFILE_LIMITS = {
  fullName: 100,
  displayName: 60,
  bio: 280,
  institution: 120,
  discipline: 80,
  gradeInterest: 80,
  studyGoal: 240,
} as const;

export type ProfileInput = {
  fullName: string;
  displayName?: string;
  bio?: string;
  institution?: string;
  discipline?: string;
  gradeInterest?: string;
  studyGoal?: string;
  showAvatar?: boolean;
};

export function validateProfileInput(input: ProfileInput): string | null {
  if (!input.fullName.trim()) return "O nome completo não pode ficar vazio.";
  if (input.fullName.trim().length > PROFILE_LIMITS.fullName) return "O nome completo é muito longo.";
  if ((input.displayName ?? "").trim().length > PROFILE_LIMITS.displayName) return "O nome de exibição é muito longo.";
  if ((input.bio ?? "").trim().length > PROFILE_LIMITS.bio) return "A apresentação deve ter no máximo 280 caracteres.";
  if ((input.institution ?? "").trim().length > PROFILE_LIMITS.institution) return "O nome da instituição é muito longo.";
  if ((input.discipline ?? "").trim().length > PROFILE_LIMITS.discipline) return "A disciplina é muito longa.";
  if ((input.gradeInterest ?? "").trim().length > PROFILE_LIMITS.gradeInterest) return "O ano ou série informado é muito longo.";
  if ((input.studyGoal ?? "").trim().length > PROFILE_LIMITS.studyGoal) return "O objetivo de estudo é muito longo.";
  return null;
}
