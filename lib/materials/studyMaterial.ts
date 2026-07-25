/** The only material kind created by the explicit study-material upload flow. */
export const STUDY_MATERIAL_KIND = "FILE" as const;

export function isStudyMaterialKind(kind: string): boolean {
  return kind === STUDY_MATERIAL_KIND;
}
