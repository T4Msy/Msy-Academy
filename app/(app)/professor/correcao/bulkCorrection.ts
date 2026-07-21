"use server";

import { applyAiSuggestedGradesBatch } from "./actions";

export type BulkCorrectionResult = Awaited<ReturnType<typeof applyAiSuggestedGradesBatch>>;

/** Isolated integration boundary for the batch-correction contract. */
export async function requestBulkCorrection(submissionIds: string[]): Promise<BulkCorrectionResult> {
  return applyAiSuggestedGradesBatch({ submissionIds });
}
