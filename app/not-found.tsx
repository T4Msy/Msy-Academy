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
        <Link href="/" className="btn btn-primary">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
