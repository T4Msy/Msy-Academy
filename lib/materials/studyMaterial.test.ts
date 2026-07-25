import { describe, expect, it } from "vitest";
import { isStudyMaterialKind, STUDY_MATERIAL_KIND } from "./studyMaterial";

describe("study material classification", () => {
  it("classifies only explicitly uploaded files as study materials", () => {
    expect(STUDY_MATERIAL_KIND).toBe("FILE");
    expect(isStudyMaterialKind("FILE")).toBe(true);
    expect(isStudyMaterialKind("EXAM")).toBe(false);
    expect(isStudyMaterialKind("ACTIVITY")).toBe(false);
    expect(isStudyMaterialKind("LESSON_PLAN")).toBe(false);
  });
});
