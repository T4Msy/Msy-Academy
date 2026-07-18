import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Acesso temporariamente indisponível" };

export default function AcessoIndisponivelPage() {
  return (
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-[440px] rounded-lg border border-border bg-card p-7 pt-8 text-center shadow-elevated">
        <div className="mb-5 flex justify-center">
          <Logo />
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.4px] text-foreground">
          Não conseguimos carregar seu acesso
        </h1>
        <p className="mt-2 text-sm leading-normal text-muted-foreground">
          Sua sessão ou seu perfil não pôde ser confirmado agora. Tente novamente ou saia para entrar de novo.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/">Tentar novamente</Link>
          </Button>
          <form action={logout}>
            <Button type="submit" variant="outline" className="w-full">
              Sair e entrar novamente
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
