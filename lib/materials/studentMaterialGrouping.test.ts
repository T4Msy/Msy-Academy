import { describe, expect, it } from "vitest";
import { groupStudentMaterials, normalizeStudentMaterials } from "./studentMaterialGrouping";

const material = (id: string, classId: string, className: string, createdAt: string) => ({ id, classId, className, title: id, createdAt });

describe("student material grouping", () => {
  it("deduplicates only within the same class and keeps recent materials first", () => {
    const result = normalizeStudentMaterials([
      material("same", "class-a", "Turma A", "2026-07-20"),
      material("same", "class-a", "Turma A", "2026-07-21"),
      material("same", "class-b", "Turma B", "2026-07-22"),
    ]);
    expect(result.map((item) => `${item.classId}:${item.id}`)).toEqual(["class-b:same", "class-a:same"]);
  });

  it("orders groups by their most recent material", () => {
    const result = groupStudentMaterials([material("a", "class-a", "Turma A", "2026-07-20"), material("b", "class-b", "Turma B", "2026-07-22")]);
    expect(result.map((group) => group.classId)).toEqual(["class-b", "class-a"]);
  });
});
