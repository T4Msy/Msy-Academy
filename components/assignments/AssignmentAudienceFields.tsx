"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AssignmentClassOption = { id: string; name: string; subject?: string | null; grade?: string | null };
export type AssignmentStudentOption = { id: string; name: string | null };

export function ClassSelect({ classes, value, onValueChange, disabled = false }: { classes: AssignmentClassOption[]; value: string; onValueChange: (value: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground" htmlFor="assignment-class">Turma</label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id="assignment-class" className="w-full bg-card text-left"><SelectValue placeholder="Selecione uma turma" /></SelectTrigger>
        <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] max-w-[min(36rem,calc(100vw-2rem))]">
          {classes.map((item) => <SelectItem key={item.id} value={item.id}>{formatClassLabel(item)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function formatClassLabel(item: AssignmentClassOption) {
  return [item.name, item.subject, item.grade].filter(Boolean).join(" — ");
}

export function AudienceSelector({ value, onValueChange, disabled = false }: { value: "class" | "students"; onValueChange: (value: "class" | "students") => void; disabled?: boolean }) {
  return (
    <fieldset className="rounded-md border border-border p-3">
      <legend className="px-1 text-sm font-semibold text-foreground">Enviar para</legend>
      <RadioGroup value={value} onValueChange={(next) => onValueChange(next as "class" | "students")} disabled={disabled} aria-label="Destinatários">
        <label className="flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm text-foreground transition-colors hover:bg-card-2"><RadioGroupItem value="class" className="mt-0.5" /><span><strong className="block">Toda a turma</strong><span className="text-muted-foreground">Todos os alunos ativos desta turma receberão o conteúdo.</span></span></label>
        <label className="flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm text-foreground transition-colors hover:bg-card-2"><RadioGroupItem value="students" className="mt-0.5" /><span><strong className="block">Alunos específicos</strong><span className="text-muted-foreground">Escolha um ou mais alunos desta turma.</span></span></label>
      </RadioGroup>
    </fieldset>
  );
}

export function StudentMultiSelect({ students, selectedIds, search, onSearchChange, onSelectionChange, disabled = false }: { students: AssignmentStudentOption[]; selectedIds: string[]; search: string; onSearchChange: (value: string) => void; onSelectionChange: (ids: string[]) => void; disabled?: boolean }) {
  const filtered = useMemo(() => students.filter((student) => (student.name ?? "Aluno").toLocaleLowerCase().includes(search.toLocaleLowerCase())), [students, search]);
  const selectedLabel = `${selectedIds.length} aluno${selectedIds.length === 1 ? "" : "s"} selecionado${selectedIds.length === 1 ? "" : "s"}`;
  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold text-foreground" aria-live="polite">{selectedLabel}</span><div className="flex gap-3 text-xs"><button type="button" className="text-brand-text underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow" disabled={disabled || filtered.length === 0} onClick={() => onSelectionChange([...new Set([...selectedIds, ...filtered.map((student) => student.id)])])}>Selecionar todos</button><button type="button" className="text-muted-foreground underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow" disabled={disabled || selectedIds.length === 0} onClick={() => onSelectionChange([])}>Limpar seleção</button></div></div>
      <Input aria-label="Buscar aluno pelo nome" placeholder="Buscar aluno pelo nome" value={search} disabled={disabled} onChange={(event) => onSearchChange(event.target.value)} />
      <div className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1" role="group" aria-label="Alunos ativos da turma">
        {students.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Esta turma ainda não possui alunos ativos.</p> : filtered.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Nenhum aluno encontrado.</p> : filtered.map((student) => {
          const checked = selectedIds.includes(student.id);
          return <label key={student.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground outline-none transition-colors hover:bg-card-2 focus-within:ring-2 focus-within:ring-brand-glow"><Checkbox checked={checked} disabled={disabled} onCheckedChange={(next) => onSelectionChange(next ? [...new Set([...selectedIds, student.id])] : selectedIds.filter((id) => id !== student.id))} /><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-dim text-xs font-semibold text-brand-text" aria-hidden="true">{(student.name ?? "A").trim().slice(0, 1).toUpperCase()}</span><span>{student.name ?? "Aluno"}</span></label>;
        })}
      </div>
    </div>
  );
}
