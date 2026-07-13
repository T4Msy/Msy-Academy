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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Olá, {firstName}</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">O que você quer fazer hoje?</p>
        </div>
      </div>

      <ActivationChecklist />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className="rounded-md border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2">
            <div className="mb-1.5 font-display text-base font-bold text-foreground">{a.title}</div>
            <p className="text-sm leading-normal text-muted-foreground">{a.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
