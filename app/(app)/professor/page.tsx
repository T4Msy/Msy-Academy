import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { ActivationChecklist } from "@/components/professor/ActivationChecklist";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Início" };

const QUICK_ACTIONS = [
  { href: "/professor/provas/nova", title: "Gerar prova", desc: "Crie uma prova com IA em minutos." },
  { href: "/professor/turmas", title: "Criar turma", desc: "Organize seus alunos e atribua conteúdo." },
  { href: "/professor/biblioteca", title: "Ver biblioteca", desc: "Provas, atividades e materiais salvos." },
];

export default async function ProfessorHomePage() {
  const { fullName } = await getSession();
  const firstName = (fullName || "Professor").split(" ")[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Olá, {firstName}</h1>
          <p className="page-subtitle">O que você quer fazer hoje?</p>
        </div>
      </div>

      <ActivationChecklist />

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
