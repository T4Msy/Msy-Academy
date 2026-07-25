export type LibraryMaterial = {
  id: string;
  kind: string;
  refId: string | null;
  storagePath: string | null;
  title: string;
  createdAt: string;
  classId: string | null;
  className: string | null;
  ownerId: string;
  isOwner: boolean;
};

export type LibraryGroup = {
  id: string | null;
  name: string;
  items: LibraryMaterial[];
  latestCreatedAt: string;
};

export function groupLibraryMaterials(materials: LibraryMaterial[]): LibraryGroup[] {
  const unique = new Map<string, LibraryMaterial>();
  for (const material of materials) {
    const key = `${material.classId ?? "unassigned"}:${material.id}`;
    if (!unique.has(key)) unique.set(key, material);
  }

  const groups = new Map<string, LibraryGroup>();
  for (const material of unique.values()) {
    const key = material.classId ?? "unassigned";
    const current = groups.get(key);
    if (current) {
      current.items.push(material);
      if (new Date(material.createdAt).getTime() > new Date(current.latestCreatedAt).getTime()) current.latestCreatedAt = material.createdAt;
    } else {
      groups.set(key, {
        id: material.classId,
        name: material.className ?? "Não enviados",
        items: [material],
        latestCreatedAt: material.createdAt,
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => {
        const dateDifference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return dateDifference !== 0 ? dateDifference : a.title.localeCompare(b.title, "pt-BR");
      }),
    }))
    .sort((a, b) => {
      if (a.id === null && b.id !== null) return 1;
      if (a.id !== null && b.id === null) return -1;
      const dateDifference = new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime();
      return dateDifference !== 0 ? dateDifference : a.name.localeCompare(b.name, "pt-BR");
    });
}
