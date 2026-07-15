import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Início" };

const QUICK_ACTIONS = [
  {
    href: "/aluno/turmas",
    title: "Minhas turmas",
    desc: "Entre com um código e acompanhe suas turmas.",
  },
  {
    href: "/aluno/tarefas",
    title: "Minhas tarefas",
    desc: "Veja o que sua turma atribuiu e os prazos.",
  },
  {
    href: "/aluno/tutor-ia",
    title: "Tirar dúvida",
    desc: "Converse com o tutor de IA sobre o conteúdo.",
  },
  {
    href: "/aluno/simulados",
    title: "Fazer simulado",
    desc: "Pratique por matéria e nível de dificuldade.",
  },
];

export default async function AlunoHomePage() {
  const { fullName } = await getSession();
  const firstName = (fullName || "aluno").split(" ")[0];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">
            Olá, {firstName}
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">O que você quer fazer hoje?</p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-md border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2"
          >
            <div className="mb-1.5 font-display text-base font-bold text-foreground">{a.title}</div>
            <p className="text-sm leading-normal text-muted-foreground">{a.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
