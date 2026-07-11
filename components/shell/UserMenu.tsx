"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/lib/auth/actions";
import { ThemeToggle } from "./ThemeToggle";

/** Topbar avatar dropdown: settings link + sign out. */
export function UserMenu({
  name,
  email,
  settingsHref,
}: {
  name: string;
  email: string;
  settingsHref: string;
}) {
  const [open, setOpen] = useState(false);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user-menu-trigger"
        aria-label="Menu da conta"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="avatar" title={name}>
          {initials || "?"}
        </span>
      </button>

      {open && (
        <>
          <div className="popover-backdrop" onClick={() => setOpen(false)} />
          <div className="popover-pop user-menu-pop" role="menu">
            <div className="user-menu-info">
              <div className="user-menu-name">{name}</div>
              {email && <div className="user-menu-email">{email}</div>}
            </div>
            <Link
              href={settingsHref}
              className="popover-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Configurações
            </Link>
            <ThemeToggle />
            <form action={logout} className="popover-item-form">
              <button type="submit" className="popover-item popover-item--danger" role="menuitem">
                Sair
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
