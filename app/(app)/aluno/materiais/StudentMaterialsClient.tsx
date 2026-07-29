"use client";

import Link from "next/link";
import { ArrowRight, Download, FileText, Image, Link2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { groupStudentMaterials, normalizeStudentMaterials } from "@/lib/materials/studentMaterialGrouping";

export type StudentMaterial = { id: string; title: string; kind: string; classId: string; className: string; createdAt: string; storagePath: string | null };

function typeLabel(kind: string) { return kind === "FILE" ? "Arquivo" : kind === "IMAGE" ? "Imagem" : kind === "LINK" ? "Link" : "Material"; }
function TypeIcon({ kind }: { kind: string }) { const Icon = kind === "IMAGE" ? Image : kind === "LINK" ? Link2 : FileText; return <Icon className="h-5 w-5" aria-hidden="true" />; }

export function StudentMaterialsClient({ materials, initialClassId = "all" }: { materials: StudentMaterial[]; initialClassId?: string }) {
  const [classId, setClassId] = useState(initialClassId);
  const [kind, setKind] = useState("all");
  const [sort, setSort] = useState("recent");
  const [query, setQuery] = useState("");
  const normalizedMaterials = useMemo(() => normalizeStudentMaterials(materials), [materials]);
  const classes = useMemo(() => [...new Map(normalizedMaterials.map((material) => [material.classId, material.className])).entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")), [normalizedMaterials]);
  const kinds = useMemo(() => [...new Set(normalizedMaterials.map((material) => material.kind))], [normalizedMaterials]);
  const visible = useMemo(() => [...normalizedMaterials.filter((material) => (classId === "all" || material.classId === classId) && (kind === "all" || material.kind === kind) && `${material.title} ${material.className}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))].sort((a, b) => sort === "title" ? a.title.localeCompare(b.title, "pt-BR") : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [classId, kind, normalizedMaterials, query, sort]);
  const grouped = useMemo(() => groupStudentMaterials(visible), [visible]);
  const recentCutoff = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;

  return <>
    {normalizedMaterials.length > 0 && <><div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{visible.length} material{visible.length === 1 ? "" : "is"} em {grouped.length} turma{grouped.length === 1 ? "" : "s"}</p><span className="hidden text-xs text-subtle sm:inline">Os mais recentes aparecem primeiro</span></div><div className="mb-6 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"><Input aria-label="Buscar material" placeholder="Buscar material" value={query} onChange={(event) => setQuery(event.target.value)} /><Select value={classId} onValueChange={setClassId}><SelectTrigger aria-label="Filtrar por turma" className="w-full"><SelectValue placeholder="Todas as turmas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as turmas</SelectItem>{classes.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select><Select value={kind} onValueChange={setKind}><SelectTrigger aria-label="Filtrar por tipo" className="w-full"><SelectValue placeholder="Todos os tipos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os tipos</SelectItem>{kinds.map((item) => <SelectItem key={item} value={item}>{typeLabel(item)}</SelectItem>)}</SelectContent></Select><Select value={sort} onValueChange={setSort}><SelectTrigger aria-label="Ordenar materiais" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">Mais recentes</SelectItem><SelectItem value="title">Por título</SelectItem></SelectContent></Select></div></>}
    {visible.length === 0 ? <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center"><p className="text-sm text-muted-foreground">{normalizedMaterials.length === 0 ? "Os materiais compartilhados com suas turmas aparecerão aqui." : "Nenhum material encontrado com esses filtros."}</p></div> : <div className="space-y-7">{grouped.map((group) => <section key={group.classId} aria-labelledby={`material-class-${group.classId}`}><div className="mb-3 flex items-end justify-between"><div><h2 id={`material-class-${group.classId}`} className="font-display text-xl font-bold text-foreground">{group.className}</h2><p className="text-sm text-muted-foreground">{group.items.length} material{group.items.length === 1 ? "" : "is"}</p></div></div><div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">{group.items.map((material) => { const isRecent = new Date(material.createdAt).getTime() >= recentCutoff; return <Link key={`${material.classId}:${material.id}`} href={`/aluno/materiais/${material.id}`} className="group flex min-h-40 flex-col gap-3 rounded-lg border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-dim text-brand-text"><TypeIcon kind={material.kind} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><h3 className="font-display text-base font-bold text-foreground">{material.title}</h3>{isRecent && <Badge className="bg-brand-dim text-brand-text">Novo</Badge>}</div><div className="mt-1 flex flex-wrap gap-1.5"><Badge variant="outline">{typeLabel(material.kind)}</Badge><span className="text-xs text-muted-foreground">{material.className}</span></div></div></div><div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-subtle"><span>{new Date(material.createdAt).toLocaleDateString("pt-BR")}</span><span className="inline-flex items-center gap-1 font-bold text-brand-text">Abrir{material.storagePath && <Download className="size-3.5" aria-hidden="true" />}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span></div></Link>; })}</div></section>)}</div>}
  </>;
}
