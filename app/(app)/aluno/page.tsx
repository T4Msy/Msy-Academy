import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, ClipboardList, Gamepad2, MessageCircleMore, Target, Users } from "lucide-react";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Início" };

const QUICK_ACTIONS = [
  {
    href: "/aluno/turmas",
    title: "Minhas turmas",
    desc: "Entre com um código e acompanhe suas turmas.",
    icon: Users,
  },
  {
    href: "/aluno/tarefas",
    title: "Minhas tarefas",
    desc: "Veja o que sua turma atribuiu e os prazos.",
    icon: ClipboardList,
  },
  {
    href: "/aluno/tutor-ia",
    title: "Tirar dúvida",
    desc: "Converse com o tutor de IA sobre o conteúdo.",
    icon: MessageCircleMore,
  },
  {
    href: "/aluno/simulados",
    title: "Fazer simulado",
    desc: "Pratique por matéria e nível de dificuldade.",
    icon: Target,
  },
  {
    href: "/aluno/estudo-animado",
    title: "Estudo Animado",
    desc: "Jogue missões curtas, ganhe pontos e bata seus recordes.",
    icon: Gamepad2,
  },
];

export default async function AlunoHomePage() {
  const { fullName } = await getSession();
  const firstName = (fullName || "aluno").split(" ")[0];

  return (
    <>
      <div className="mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Olá, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">O que você quer fazer hoje?</p>
        </div>
      </div>

      <section aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Ações rápidas</h2>
        <div className="grid gap-2.5 lg:grid-cols-2">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.href} href={a.href} className="group flex min-h-20 items-center gap-3 rounded-md border border-border bg-card px-3.5 py-3 outline-none transition-colors hover:border-border-hover hover:bg-card-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-card-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-dim text-brand-text" aria-hidden><Icon size={19} strokeWidth={1.8} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-bold text-foreground">{a.title}</span>
                  <span className="mt-0.5 block text-xs leading-normal text-muted-foreground">{a.desc}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
