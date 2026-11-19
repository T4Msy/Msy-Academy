"use client";

import Link from "next/link";
import { BookOpen, FileCheck2, NotebookTabs, Waypoints } from "lucide-react";
import { useStudentDashboardStats } from "@/hooks/useStudentDashboardStats";

export function StudentFocusDashboard() {
  const { data, isError } = useStudentDashboardStats();
  if (isError) return <p role="alert" className="text-base text-danger-text">Não foi possível carregar seu Modo Foco.</p>;
  if (!data) return <div className="space-y-4" aria-label="Carregando Modo Foco"><div className="h-28 animate-pulse rounded-lg bg-card" /><div className="h-56 animate-pulse rounded-lg bg-card" /></div>;
  const { routine } = data;
  const overall = routine.assignmentProgress.total ? Math.round((routine.assignmentProgress.completed / routine.assignmentProgress.total) * 100) : 0;
  const tools = [{ href: "/aluno/plano-de-estudos", label: "Planejar", Icon: NotebookTabs }, { href: "/aluno/flashcards", label: "Revisar", Icon: Waypoints }, { href: "/aluno/simulados", label: "Simulado", Icon: FileCheck2 }];
  return <div className="focus-home space-y-8">
    <section aria-labelledby="focus-classes"><h1 id="focus-classes">Minhas Turmas</h1><div className="focus-grid">{routine.classes.length ? routine.classes.map((item) => <Link key={item.id} href={`/aluno/turmas/${item.id}`} className="focus-card"><BookOpen aria-hidden /><span><strong>{item.name}</strong><small>{item.subject ?? "Turma"}</small></span></Link>) : <p className="focus-empty">Você ainda não está em uma turma.</p>}</div></section>
    <section aria-labelledby="focus-notices"><h2 id="focus-notices">Avisos Importantes</h2><div className="focus-list">{routine.announcements.filter((item) => item.isImportant).length ? routine.announcements.filter((item) => item.isImportant).slice(0, 3).map((item) => <article key={item.id}><strong>{item.className}</strong><p>{item.message}</p></article>) : <p className="focus-empty">Nenhum aviso importante por enquanto.</p>}</div></section>
    <section aria-labelledby="focus-next"><h2 id="focus-next">Como Continuar</h2><div className="focus-grid focus-grid--actions">{tools.map(({ href, label, Icon }) => <Link key={href} href={href} className="focus-action"><Icon aria-hidden />{label}</Link>)}</div></section>
    <section aria-labelledby="focus-progress"><h2 id="focus-progress">Progresso</h2><div className="focus-list"><article><div className="focus-progress-label"><strong>Progresso geral</strong><b>{overall}%</b></div><div className="focus-progress-bar" role="progressbar" aria-label="Progresso geral" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overall}><span style={{ width: `${overall}%` }} /></div><p>{routine.assignmentProgress.completed} de {routine.assignmentProgress.total} atividades concluídas</p></article>{routine.recentGrades.map((grade) => { const max = grade.maxScore || 10; const percentage = Math.min(100, Math.round((grade.score / max) * 100)); const remaining = Math.max(0, max - grade.score); return <article key={grade.id}><div className="focus-progress-label"><strong>{grade.title}</strong><b>{percentage}%</b></div><p>{grade.score.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} / {max.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} · Faltam {remaining.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pts</p><div className="focus-progress-bar" role="progressbar" aria-label={`Progresso em ${grade.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><span style={{ width: `${percentage}%` }} /></div></article>; })}</div></section>
  </div>;
}
