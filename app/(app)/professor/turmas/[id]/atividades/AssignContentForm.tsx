"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignContent } from "../../actions";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AudienceSelector, ClassSelect, StudentMultiSelect, type AssignmentStudentOption } from "@/components/assignments/AssignmentAudienceFields";

type ContentOption = { id: string; title: string };
type ClassOption = { id: string; name: string };
type ModuleOption = { id: string; name: string };

export function AssignContentForm({
  classId,
  classes,
  studentsByClass,
  exams,
  activities,
  modules,
}: {
  classId: string;
  classes: ClassOption[];
  studentsByClass: Record<string, AssignmentStudentOption[]>;
  exams: ContentOption[];
  activities: ContentOption[];
  modules: ModuleOption[];
}) {
  const [open, setOpen] = useState(false);
  const [contentType, setContentType] = useState<"EXAM" | "ACTIVITY">("EXAM");
  const [contentId, setContentId] = useState("");
  const [contentCategory, setContentCategory] = useState<"avaliacao" | "exercicio">("avaliacao");
  const [moduleId, setModuleId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(classId);
  const [audienceType, setAudienceType] = useState<"class" | "students">("class");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [applicationType, setApplicationType] = useState("regular");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const options = contentType === "EXAM" ? exams : activities;
  const students = studentsByClass[selectedClassId] ?? [];
  const selectedClass = classes.find((item) => item.id === selectedClassId);

  function changeClass(value: string) {
    setSelectedClassId(value); setSelectedStudents([]); setSearch("");
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedClassId) return setError("Selecione uma turma para continuar.");
    if (!contentId) return setError("Escolha o que atribuir.");
    if (audienceType === "students" && selectedStudents.length === 0) return setError("Selecione pelo menos um aluno para continuar.");
    setError(null);
    startTransition(async () => {
      try {
        await assignContent({
          classId: selectedClassId,
          contentType,
          contentId,
          audienceType,
          studentIds: audienceType === "students" ? selectedStudents : [],
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          applicationType,
          instructions: instructions || null,
          moduleId: moduleId || null,
          contentCategory,
        });
        setOpen(false); setContentId(""); setDueAt(""); setSelectedStudents([]); setInstructions(""); setModuleId(""); router.refresh();
      } catch (err) { setError(err instanceof Error ? err.message : "Não conseguimos atribuir este conteúdo."); }
    });
  }

  if (!open) return <button type="button" className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-3 py-[7px] text-sm font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] outline-none transition-all hover:-translate-y-px hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-brand-glow disabled:opacity-50" onClick={() => setOpen(true)} disabled={classes.length === 0 || (exams.length === 0 && activities.length === 0)}>Atribuir conteúdo</button>;

  const recipientText = audienceType === "class" ? `todos os ${students.length} alunos` : `${selectedStudents.length} aluno${selectedStudents.length === 1 ? "" : "s"}`;
  return <form onSubmit={onSubmit} className="flex w-full max-w-[620px] flex-col gap-3 p-1" aria-label="Atribuir conteúdo">
    <div className="grid gap-3 sm:grid-cols-2"><label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">Tipo<Select value={contentType} onValueChange={(value) => { setContentType(value as "EXAM" | "ACTIVITY"); setContentId(""); }} disabled={pending}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EXAM">Prova</SelectItem><SelectItem value="ACTIVITY">Atividade</SelectItem></SelectContent></Select></label><label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">Qual<Select value={contentId} onValueChange={setContentId} disabled={pending}><SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger><SelectContent>{options.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select></label></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
        Categoria
        <Select value={contentCategory} onValueChange={(value) => setContentCategory(value as "avaliacao" | "exercicio")} disabled={pending}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="avaliacao">Avaliação</SelectItem><SelectItem value="exercicio">Exercício</SelectItem></SelectContent>
        </Select>
      </label>
      {modules.length > 1 && (
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
          Módulo (opcional)
          <Select value={moduleId || "none"} onValueChange={(value) => setModuleId(value === "none" ? "" : value)} disabled={pending}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem módulo</SelectItem>
              {modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
      )}
    </div>
    <ClassSelect classes={classes} value={selectedClassId} onValueChange={changeClass} disabled={pending} />
    <AudienceSelector value={audienceType} onValueChange={(value) => { setAudienceType(value); if (value === "class") setSelectedStudents([]); }} disabled={pending} />
    {audienceType === "students" && <StudentMultiSelect students={students} selectedIds={selectedStudents} search={search} onSearchChange={setSearch} onSelectionChange={setSelectedStudents} disabled={pending} />}
    <div className="grid gap-3 sm:grid-cols-2"><label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">Prazo (opcional)<Input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} disabled={pending} /></label><label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">Tipo de aplicação<Select value={applicationType} onValueChange={setApplicationType} disabled={pending}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[["regular", "Regular"], ["recuperacao", "Recuperação"], ["segunda_chamada", "Segunda chamada"], ["reposicao", "Reposição"], ["reforco", "Reforço"], ["avaliacao_individual", "Avaliação individual"], ["outro", "Outro"]].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label></div>
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">Instruções específicas (opcional)<textarea className="min-h-16 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" value={instructions} onChange={(event) => setInstructions(event.target.value)} disabled={pending} /></label>
    <p className="rounded-md bg-card-2 px-3 py-2 text-sm text-muted-foreground">Esta {contentType === "EXAM" ? "prova" : "atividade"} será enviada para {recipientText} da turma {selectedClass?.name ?? "selecionada"}.</p>
    {error && <div role="alert" aria-live="assertive" className="rounded-md border border-danger-border bg-danger-dim px-4 py-3 text-sm text-danger-text">{error}</div>}
    <div className="flex flex-wrap justify-end gap-2"><button type="button" className="rounded-sm border border-border px-3 py-[7px] text-sm font-semibold text-foreground" disabled={pending} onClick={() => setOpen(false)}>Cancelar</button><button type="submit" className="rounded-sm bg-primary px-3 py-[7px] text-sm font-bold text-primary-foreground disabled:opacity-50" disabled={pending || !selectedClassId || (audienceType === "students" && selectedStudents.length === 0)}>{pending ? "Enviando…" : `Confirmar envio`}</button></div>
  </form>;
}
