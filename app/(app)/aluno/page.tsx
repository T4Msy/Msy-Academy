import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Início" };

const QUICK_ACTIONS = [
  { href: "/aluno/tarefas", title: "Minhas tarefas", desc: "Veja o que sua turma atribuiu e os prazos." },
  { href: "/aluno/tutor-ia", title: "Tirar dúvida", desc: "Converse com o tutor de IA sobre o conteúdo." },
  { href: "/aluno/simulados", title: "Fazer simulado", desc: "Pratique por matéria e nível de dificuldade." },
];

export default async function AlunoHomePage() {
  const { fullName } = await getSession();
  const firstName = (fullName || "aluno").split(" ")[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Olá, {firstName}</h1>
          <p className="page-subtitle">O que você quer fazer hoje?</p>
        </div>
      </div>

      <div className="quick-actions-grid">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className="quick-action-card">
            <div className="quick-action-title">{a.title}</div>
            <p className="quick-action-desc">{a.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
