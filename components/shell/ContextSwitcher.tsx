import Link from "next/link";

/**
 * RF-G03 — lets a user with both roles switch environment without a new
 * login. The URL segment (/professor vs /aluno) IS the source of truth for
 * "current environment", so this is just a link to the other environment's
 * home — no client state to keep in sync.
 */
export function ContextSwitcher({ current }: { current: "PROFESSOR" | "ALUNO" }) {
  const target = current === "PROFESSOR" ? { href: "/aluno", label: "Ambiente do Aluno" } : { href: "/professor", label: "Ambiente do Professor" };

  return (
    <Link href={target.href} className="context-switch" title={`Mudar para ${target.label}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 16V4M7 4 3 8M7 4l4 4M17 8v12m0 0 4-4m-4 4-4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {target.label}
    </Link>
  );
}
