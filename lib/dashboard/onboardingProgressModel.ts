export type ProfessorOnboardingProgress = {
  hasClass: boolean;
  hasSavedExam: boolean;
  hasInvitedStudent: boolean;
  completedSteps: number;
  totalSteps: number;
};

export function deriveProfessorOnboardingProgress(classCount: number, examCount: number, activeEnrollmentCount: number): ProfessorOnboardingProgress {
  const hasClass = classCount > 0;
  const hasSavedExam = examCount > 0;
  const hasInvitedStudent = activeEnrollmentCount > 0;
  return { hasClass, hasSavedExam, hasInvitedStudent, completedSteps: [hasClass, hasSavedExam, hasInvitedStudent].filter(Boolean).length, totalSteps: 3 };
}
