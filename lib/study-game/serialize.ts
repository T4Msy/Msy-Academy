import type { StudyGameQuestion, StudyGameRun } from "./types";

export function toStudyGameRun(row: {
  id: string;
  subject: string;
  topic: string;
  questions: unknown;
  status: StudyGameRun["status"];
  current_question_index: number;
  score: number;
  combo: number;
  lives_remaining: number;
  correct_count: number;
}): StudyGameRun {
  return {
    id: row.id,
    subject: row.subject,
    topic: row.topic,
    questions: row.questions as StudyGameQuestion[],
    status: row.status,
    currentQuestionIndex: row.current_question_index,
    score: row.score,
    combo: row.combo,
    livesRemaining: row.lives_remaining,
    correctCount: row.correct_count,
  };
}
