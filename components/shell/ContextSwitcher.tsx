import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

/**
 * RF-G03 — lets a user with both roles switch environment without a new
 * login. The URL segment (/professor vs /aluno) IS the source of truth for
 * "current environment", so this is just a link to the other environment's
 * home — no client state to keep in sync.
 */
export function ContextSwitcher({ current }: { current: "PROFESSOR" | "ALUNO" }) {
  const target = current === "PROFESSOR" ? { href: "/aluno", label: "Aluno" } : { href: "/professor", label: "Professor" };

  return (
    <Link
      href={target.href}
      className="context-switch"
      title={`Mudar para o ambiente de ${target.label}`}
      aria-label={`Mudar para o ambiente de ${target.label}`}
    >
      <ArrowLeftRight size={13} strokeWidth={1.8} aria-hidden />
      {target.label}
    </Link>
  );
}
