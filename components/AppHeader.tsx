import Link from "next/link";
import { Logo } from "@/components/Logo";
import { logout } from "@/app/(auth)/actions";

export function AppHeader({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <header className="header" role="banner">
      <div className="header-inner">
        <div className="brand">
          <Logo />
          <div>
            <div className="brand-title">MSY Academy</div>
            <div className="brand-sub">Ambiente do Professor</div>
          </div>
        </div>

        <div className="header-right">
          <nav className="header-nav">
            <Link className="nav-link" href="/dashboard">
              Minhas Provas
            </Link>
            <Link className="nav-link" href="/provas/nova">
              Nova Prova
            </Link>
          </nav>
          <div className="user-chip">
            <span className="avatar" title={name}>
              {initials || "?"}
            </span>
            <form action={logout}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
