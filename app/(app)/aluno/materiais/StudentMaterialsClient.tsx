"use client";

import Link from "next/link";
import { FileText, Image, Link2, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type StudentMaterial = { id: string; title: string; kind: string; classId: string; className: string; createdAt: string; storagePath: string | null };

function typeLabel(kind: string) { return kind === "FILE" ? "PDF" : kind === "IMAGE" ? "Imagem" : kind === "LINK" ? "Link" : "Material"; }
function TypeIcon({ kind }: { kind: string }) { const Icon = kind === "IMAGE" ? Image : kind === "LINK" ? Link2 : FileText; return <Icon className="h-5 w-5" aria-hidden="true" />; }

export function StudentMaterialsClient({ materials }: { materials: StudentMaterial[] }) {
  const [classId, setClassId] = useState("all");
  const [query, setQuery] = useState("");
  const classes = useMemo(() => [...new Map(materials.map((material) => [material.classId, material.className])).entries()], [materials]);
  const visible = useMemo(() => materials.filter((material) => (classId === "all" || material.classId === classId) && `${material.title} ${material.className}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [classId, materials, query]);
  const grouped = useMemo(() => visible.reduce<Map<string, { name: string; items: StudentMaterial[] }>>((map, material) => { const group = map.get(material.classId) ?? { name: material.className, items: [] }; group.items.push(material); map.set(material.classId, group); return map; }, new Map()), [visible]);

  return <>
    {materials.length > 0 && <div className="mb-6 flex flex-col gap-2 sm:flex-row"><Input aria-label="Buscar material" placeholder="Buscar material" value={query} onChange={(event) => setQuery(event.target.value)} /><Select value={classId} onValueChange={setClassId}><SelectTrigger aria-label="Filtrar por turma" className="w-full sm:w-64"><SelectValue placeholder="Todas as turmas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as turmas</SelectItem>{classes.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></div>}
    {visible.length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center"><p className="text-sm text-muted-foreground">{materials.length === 0 ? "Os materiais compartilhados pelos seus professores aparecerão aqui." : "Nenhum material foi compartilhado com esta turma."}</p></div> : <div className="space-y-7">{[...grouped.entries()].map(([id, group]) => <section key={id} aria-labelledby={`material-class-${id}`}><div className="mb-3 flex items-end justify-between"><div><h2 id={`material-class-${id}`} className="font-display text-xl font-bold text-foreground">{group.name}</h2><p className="text-sm text-muted-foreground">{group.items.length} material{group.items.length === 1 ? "" : "is"}</p></div></div><div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">{group.items.map((material) => <Link key={material.id} href={`/aluno/materiais/${material.id}`} className="flex min-h-36 flex-col gap-3 rounded-lg border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-dim text-brand-text"><TypeIcon kind={material.kind} /></span><div className="min-w-0"><h3 className="font-display text-base font-bold text-foreground">{material.title}</h3><Badge variant="outline" className="mt-1">{typeLabel(material.kind)}</Badge></div></div><div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-subtle"><span>{new Date(material.createdAt).toLocaleDateString("pt-BR")}</span><span className="inline-flex items-center gap-1 text-brand-text"><Download className="h-3.5 w-3.5" aria-hidden="true" />Abrir</span></div></Link>)}</div></section>)}</div>}
  </>;
}
