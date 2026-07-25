import { describe, expect, it } from "vitest";
import { groupLibraryMaterials, type LibraryMaterial } from "./libraryGrouping";

const material = (id: string, classId: string | null, createdAt: string): LibraryMaterial => ({
  id,
  kind: "FILE",
  refId: null,
  storagePath: `${id}.pdf`,
  title: id,
  createdAt,
  classId,
  className: classId ? `Turma ${classId}` : null,
  ownerId: "teacher",
  isOwner: true,
});

describe("professor library grouping", () => {
  it("groups by class id, keeps unassigned materials separate, and deduplicates within a class", () => {
    const groups = groupLibraryMaterials([
      material("shared", "a", "2026-07-20"),
      material("shared", "a", "2026-07-20"),
      material("shared", "b", "2026-07-21"),
      material("draft", null, "2026-07-22"),
    ]);

    expect(groups.map((group) => group.id)).toEqual(["b", "a", null]);
    expect(groups.find((group) => group.id === "a")?.items).toHaveLength(1);
    expect(groups.find((group) => group.id === null)?.name).toBe("Não enviados");
  });
});
