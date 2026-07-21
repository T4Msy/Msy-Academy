export type StudyGameQuestion = {
  id: string;
  type: "MULTIPLA" | "VF";
  statement: string;
  options: { id: string; text: string }[];
};

export type StudyGameRun = {
  id: string;
  subject: string;
  topic: string;
  questions: StudyGameQuestion[];
  status: "ACTIVE" | "WON" | "LOST" | "ABANDONED";
  currentQuestionIndex: number;
  score: number;
  combo: number;
  livesRemaining: number;
  correctCount: number;
};

export type StudyGameAnswerResult = {
  isCorrect: boolean;
  explanation: string | null;
  score: number;
  combo: number;
  livesRemaining: number;
  status: StudyGameRun["status"];
  nextQuestionIndex: number;
  newRecord: boolean;
};
