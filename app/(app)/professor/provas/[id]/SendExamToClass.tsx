"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { assignContent } from "../../turmas/actions";
import { AudienceSelector, ClassSelect, StudentMultiSelect, type AssignmentStudentOption } from "@/components/assignments/AssignmentAudienceFields";
import { Input } from "@/components/ui/input";

type ClassOption = { id: string; name: string; assignmentId?: string };

export function SendExamToClass({ examId, examTitle, questionCount, classes, studentsByClass }: { examId: string; examTitle: string; questionCount: number; classes: ClassOption[]; studentsByClass: Record<string, AssignmentStudentOption[]> }) {
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState("");
  const [audienceType, setAudienceType] = useState<"class" | "students">("class");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const students = studentsByClass[classId] ?? [];
  const selectedClass = classes.find((item) => item.id === classId);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !pending) setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, pending]);

  function changeClass(value: string) {
    setClassId(value); setSelectedStudents([]); setSearch(""); setError(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!classId) return setError("Selecione uma turma para continuar.");
    if (audienceType === "students" && selectedStudents.length === 0) return setError("Selecione pelo menos um aluno para continuar.");
    if (dueAt && new Date(dueAt).getTime() <= Date.now()) return setError("O prazo precisa estar no futuro.");
    setError(null);
    startTransition(async () => {
      try {
        await assignContent({ classId, contentType: "EXAM", contentId: examId, audienceType, studentIds: audienceType === "students" ? selectedStudents : [], dueAt: dueAt ? new Date(dueAt).toISOString() : null });
        setOpen(false); setClassId(""); setSelectedStudents([]); setSearch(""); setDueAt(""); router.refresh();
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("[assignment/exam] falha ao enviar", err);
        setError("Não foi possível concluir o envio no momento.");
      }
    });
  }

  if (questionCount === 0) return null;
  if (classes.length === 0) {
    return (
      <div role="status" className="max-w-64 rounded-sm border border-border bg-card-2 px-3 py-2 text-xs leading-snug text-muted-foreground">
        Não há turma registrada nesta conta como proprietária. Crie uma turma ou solicite a transferência de uma turma existente em{" "}
        <Link href="/professor/turmas" className="font-semibold text-brand-text hover:underline">Turmas</Link>.
      </div>
    );
  }
  if (!open) return <button id="send-content" type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-3 py-[7px] text-sm font-bold text-primary-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow">Enviar para turma</button>;

  const recipientText = audienceType === "class" ? `todos os ${students.length} alunos` : `${selectedStudents.length} aluno${selectedStudents.length === 1 ? "" : "s"}`;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setOpen(false); }}>
    <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="send-exam-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-2xl">
      <h2 id="send-exam-title" className="font-display text-xl font-bold text-foreground">Enviar prova</h2>
      <p className="mt-2 text-sm text-muted-foreground">{examTitle} · {questionCount} questão{questionCount === 1 ? "" : "ões"}</p>
      <div className="mt-5 flex flex-col gap-3.5">
        <ClassSelect classes={classes} value={classId} onValueChange={changeClass} disabled={pending} />
        <AudienceSelector value={audienceType} onValueChange={(value) => { setAudienceType(value); if (value === "class") setSelectedStudents([]); }} disabled={pending || !classId} />
        {audienceType === "students" && <StudentMultiSelect students={students} selectedIds={selectedStudents} search={search} onSearchChange={setSearch} onSelectionChange={setSelectedStudents} disabled={pending || !classId} />}
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground" htmlFor="send-due">Prazo (opcional)<Input id="send-due" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} disabled={pending} /></label>
      </div>
      <p className="mt-4 rounded-md bg-card-2 px-3 py-2 text-sm text-muted-foreground">Esta prova será enviada para {recipientText} da turma {selectedClass?.name ?? "selecionada"}.</p>
      {error && <p role="alert" aria-live="assertive" className="mt-3 rounded-md border border-danger-border bg-danger-dim px-3 py-2 text-sm text-danger-text">{error}</p>}
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} disabled={pending} className="min-h-11 rounded-sm border border-border px-3 py-2 text-sm font-semibold text-foreground">Cancelar</button><button type="submit" disabled={pending || !classId || (audienceType === "students" && selectedStudents.length === 0)} className="min-h-11 rounded-sm bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">{pending ? "Enviando…" : "Enviar prova"}</button></div>
    </form>
  </div>;
}
