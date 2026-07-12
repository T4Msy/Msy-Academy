"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AiThinking } from "@/components/AiThinking";

interface SearchResults {
  materials: { id: string; kind: string; ref_id: string | null; title: string }[];
  classes: { id: string; name: string }[];
}

const MATERIAL_HREF: Record<string, (env: "PROFESSOR" | "ALUNO", refId: string) => string | null> = {
  EXAM: (env, id) => (env === "PROFESSOR" ? `/professor/provas/${id}` : null),
  ACTIVITY: (env, id) => (env === "PROFESSOR" ? `/professor/atividades/${id}` : null),
  LESSON_PLAN: (env, id) => (env === "PROFESSOR" ? `/professor/planos-de-aula/${id}` : null),
};

export function GlobalSearch({ environment }: { environment: "PROFESSOR" | "ALUNO" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) setResults(await res.json());
      } catch {
        // Search failing silently is acceptable — it's a convenience, not a critical path.
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const classesHref = environment === "PROFESSOR" ? "/professor/turmas" : null;
  const hasResults = results && (results.materials.length > 0 || results.classes.length > 0);

  function onContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  }

  return (
    <div className="global-search" onBlur={onContainerBlur}>
      <input
        type="search"
        className="input global-search-input"
        placeholder="Buscar materiais, turmas…"
        aria-label="Busca global"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
      />

      {open && query.trim().length >= 2 && (
        <div className="popover-pop global-search-results">
          {!results ? (
            <p className="field-hint popover-hint"><AiThinking label="Buscando" /></p>
          ) : !hasResults ? (
            <p className="field-hint popover-hint">Nada encontrado para &quot;{query}&quot;.</p>
          ) : (
            <>
              {results.materials.map((m) => {
                const href = m.kind === "FILE" || !m.ref_id ? null : MATERIAL_HREF[m.kind]?.(environment, m.ref_id);
                return href ? (
                  <Link key={m.id} href={href} className="popover-item">
                    <span className="chip mr-xs">Material</span>
                    {m.title}
                  </Link>
                ) : (
                  <span key={m.id} className="popover-item popover-item--static">
                    <span className="chip mr-xs">Material</span>
                    {m.title}
                  </span>
                );
              })}
              {results.classes.map((c) =>
                classesHref ? (
                  <Link key={c.id} href={`${classesHref}/${c.id}`} className="popover-item">
                    <span className="chip mr-xs">Turma</span>
                    {c.name}
                  </Link>
                ) : (
                  <span key={c.id} className="popover-item popover-item--static">
                    <span className="chip mr-xs">Turma</span>
                    {c.name}
                  </span>
                ),
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
