"use client";

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaterialItem } from "./MaterialItem";
import { groupLibraryMaterials, type LibraryMaterial } from "@/lib/materials/libraryGrouping";

export function ProfessorLibraryClient({ materials }: { materials: LibraryMaterial[] }) {
  const [classFilter, setClassFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const groups = useMemo(() => groupLibraryMaterials(materials), [materials]);
  const classOptions = useMemo(() => groups.filter((group) => group.id !== null), [groups]);
  const kindOptions = useMemo(() => [...new Set(materials.map((material) => material.kind))].sort(), [materials]);
  const visibleGroups = useMemo(
    () => groups
      .map((group) => ({ ...group, items: group.items.filter((material) => kindFilter === "all" || material.kind === kindFilter) }))
      .filter((group) => (classFilter === "all" || (classFilter === "unassigned" ? group.id === null : group.id === classFilter)) && group.items.length > 0),
    [classFilter, groups, kindFilter],
  );
  const visibleCount = visibleGroups.reduce((total, group) => total + group.items.length, 0);
  const kindLabel: Record<string, string> = { FILE: "PDF", EXAM: "Provas", ACTIVITY: "Atividades", LESSON_PLAN: "Planos de aula" };

  if (materials.length === 0) return <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhum material salvo.</div>;

  return (
    <>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger aria-label="Filtrar por turma" className="w-full sm:w-64"><SelectValue placeholder="Todas as turmas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as turmas</SelectItem>
            {classOptions.map((group) => <SelectItem key={group.id} value={group.id!}>{group.name}</SelectItem>)}
            {groups.some((group) => group.id === null) && <SelectItem value="unassigned">Não enviados</SelectItem>}
          </SelectContent>
        </Select>
        {kindOptions.length > 1 && <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger aria-label="Filtrar por tipo" className="w-full sm:w-64"><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {kindOptions.map((kind) => <SelectItem key={kind} value={kind}>{kindLabel[kind] ?? kind}</SelectItem>)}
          </SelectContent>
        </Select>}
      </div>
      {visibleCount === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhum material encontrado com esses filtros.</div> : <div className="flex flex-col gap-7">
        {visibleGroups.map((group) => <section key={group.id ?? "unassigned"} aria-labelledby={`library-group-${group.id ?? "unassigned"}`}>
          <div className="mb-3 flex items-end justify-between gap-3"><div><h2 id={`library-group-${group.id ?? "unassigned"}`} className="font-display text-xl font-bold text-foreground">{group.name}</h2><p className="text-sm text-muted-foreground">{group.items.length} material{group.items.length === 1 ? "" : "is"}</p></div></div>
          <div className="flex flex-col gap-3.5">{group.items.map((material) => <MaterialItem key={`${material.classId ?? "unassigned"}:${material.id}`} id={material.id} kind={material.kind} refId={material.refId} storagePath={material.storagePath} title={material.title} isOwner={material.isOwner} />)}</div>
        </section>)}
      </div>}
    </>
  );
}
