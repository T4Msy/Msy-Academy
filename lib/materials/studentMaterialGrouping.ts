export type GroupableStudentMaterial = { id: string; classId: string; className: string; title: string; createdAt: string };

export function normalizeStudentMaterials<T extends GroupableStudentMaterial>(materials: T[]) {
  const unique = new Map<string, T>();
  for (const material of materials) {
    const key = `${material.classId}:${material.id}`;
    if (!unique.has(key)) unique.set(key, material);
  }
  return [...unique.values()].sort((a, b) => {
    const dateDifference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (dateDifference !== 0) return dateDifference;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}

export function groupStudentMaterials<T extends GroupableStudentMaterial>(materials: T[]) {
  const grouped = new Map<string, { classId: string; className: string; items: T[]; latestCreatedAt: string }>();
  for (const material of materials) {
    const current = grouped.get(material.classId);
    if (current) current.items.push(material);
    else grouped.set(material.classId, { classId: material.classId, className: material.className, items: [material], latestCreatedAt: material.createdAt });
  }
  return [...grouped.values()].sort((a, b) => {
    const latestDifference = new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime();
    return latestDifference !== 0 ? latestDifference : a.className.localeCompare(b.className, "pt-BR");
  });
}
