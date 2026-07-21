export const MAX_QUESTION_TAGS = 10;
export const MAX_QUESTION_TAG_LENGTH = 40;
export function normalizeQuestionTags(tags: string[] | undefined): string[] | undefined {
  if (tags === undefined) return undefined;
  const result: string[] = [];
  for (const raw of tags) {
    const value = raw.trim();
    if (!value) continue;
    if (value.length > MAX_QUESTION_TAG_LENGTH) throw new Error(`Cada tag pode ter no maximo ${MAX_QUESTION_TAG_LENGTH} caracteres.`);
    if (!result.some((tag) => tag.toLocaleLowerCase() === value.toLocaleLowerCase())) result.push(value);
  }
  if (result.length > MAX_QUESTION_TAGS) throw new Error(`Uma questao pode ter no maximo ${MAX_QUESTION_TAGS} tags.`);
  return result;
}
export function parseTagsParam(value?: string): string[] { return normalizeQuestionTags(value?.split(",") ?? []) ?? []; }
