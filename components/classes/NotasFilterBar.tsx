"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export type NotaAvaliacaoOption = { id: string; title: string; kind: "EXAM" | "ACTIVITY" };

/**
 * Filtros de Notas: avaliação, mês, ano — todos na URL (?avaliacao=&mes=&ano=).
 * Filtro de módulo/semestre já é coberto pelo ModuleSwitcher no header da
 * turma — não duplicar aqui com um segundo controle para a mesma coisa.
 */
export function NotasFilterBar({
  avaliacoes,
  years,
}: {
  avaliacoes: NotaAvaliacaoOption[];
  years: number[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const avaliacaoId = searchParams.get("avaliacao") ?? "all";
  const mes = searchParams.get("mes") ?? "all";
  const ano = searchParams.get("ano") ?? "all";
  const hasActiveFilter = avaliacaoId !== "all" || mes !== "all" || ano !== "all";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function clearAll() {
    router.replace(pathname);
  }

  const selectedAvaliacao = avaliacoes.find((item) => item.id === avaliacaoId);

  return (
    <div className="mb-4 flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="notas-filtro-avaliacao">Avaliação</label>
        <Select value={avaliacaoId} onValueChange={(value) => setParam("avaliacao", value)}>
          <SelectTrigger id="notas-filtro-avaliacao" size="sm" className="bg-card">
            <SelectValue placeholder="Avaliação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as avaliações</SelectItem>
            {avaliacoes.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.kind === "EXAM" ? "Prova" : "Atividade"} — {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="sr-only" htmlFor="notas-filtro-mes">Mês</label>
        <Select value={mes} onValueChange={(value) => setParam("mes", value)}>
          <SelectTrigger id="notas-filtro-mes" size="sm" className="bg-card">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            {MONTHS.map((name, index) => (
              <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="sr-only" htmlFor="notas-filtro-ano">Ano</label>
        <Select value={ano} onValueChange={(value) => setParam("ano", value)}>
          <SelectTrigger id="notas-filtro-ano" size="sm" className="bg-card">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os anos</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
            Limpar filtros
          </Button>
        )}
      </div>

      {hasActiveFilter && (
        <div className="flex flex-wrap gap-1.5">
          {selectedAvaliacao && (
            <FilterChip
              label={selectedAvaliacao.title}
              onRemove={() => setParam("avaliacao", "all")}
            />
          )}
          {mes !== "all" && (
            <FilterChip
              label={MONTHS[Number(mes) - 1]}
              onRemove={() => setParam("mes", "all")}
            />
          )}
          {ano !== "all" && (
            <FilterChip label={ano} onRemove={() => setParam("ano", "all")} />
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-dim px-2.5 py-1 text-xs font-semibold text-brand-text">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover filtro ${label}`}
        className="rounded-full p-0.5 outline-none hover:bg-[rgba(var(--overlay-rgb),0.12)] focus-visible:ring-2 focus-visible:ring-brand-glow"
      >
        <X className="size-3" aria-hidden />
      </button>
    </span>
  );
}
