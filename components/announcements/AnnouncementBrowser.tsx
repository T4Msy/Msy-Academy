"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatDateTime } from "@/lib/classes/format";

export type AnnouncementListItem = {
  id: string;
  message: string;
  createdAt: string;
  classId: string;
  className: string;
  teacherName?: string | null;
};

export function AnnouncementBrowser({
  announcements,
  showTeacher = false,
}: {
  announcements: AnnouncementListItem[];
  showTeacher?: boolean;
}) {
  const [classId, setClassId] = useState("all");
  const [query, setQuery] = useState("");
  const classes = useMemo(
    () => [...new Map(announcements.map((item) => [item.classId, item.className])).entries()],
    [announcements],
  );
  const visible = announcements.filter((item) => {
    const matchesClass = classId === "all" || item.classId === classId;
    return matchesClass && item.message.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  });

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="announcement-class">Filtrar por turma</label>
        <select id="announcement-class" value={classId} onChange={(event) => setClassId(event.target.value)} className="min-h-11 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-glow">
          <option value="all">Todas as turmas</option>
          {classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <label className="relative min-w-0 flex-1" htmlFor="announcement-search">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <span className="sr-only">Buscar nos avisos</span>
          <input id="announcement-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar na mensagem" className="min-h-11 w-full rounded-md border border-input bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand-glow" />
        </label>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="font-display text-base font-bold text-foreground">Nenhum aviso por enquanto</p>
          <p className="mt-1 text-sm text-muted-foreground">Os comunicados dos professores aparecerão aqui.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((announcement) => (
            <li key={announcement.id}>
              <Link href={`/aluno/turmas/${announcement.classId}/avisos`} className="block rounded-lg border border-border bg-card p-4 transition hover:border-border-hover hover:bg-card-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow">
                <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{announcement.message}</p>
                <p className="mt-3 text-xs text-muted-foreground">{[showTeacher ? announcement.teacherName : null, announcement.className, formatDateTime(announcement.createdAt)].filter(Boolean).join(" · ")}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
