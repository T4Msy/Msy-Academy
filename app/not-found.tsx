import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="state-wrap">
      <div className="state-card">
        <Logo size={40} />
        <div className="state-code">404</div>
        <h1 className="state-title">Página não encontrada</h1>
        <p className="state-desc">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <Link href="/" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
