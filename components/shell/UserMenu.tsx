"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";

/** Topbar avatar dropdown: settings link, theme toggle e sign out.
 *  Primeiro overlay do shell nas primitivas do DS (Radix): ganha focus
 *  trap, navegação por teclado e fechamento por Esc de graça. */
export function UserMenu({
  name,
  email,
  settingsHref,
}: {
  name: string;
  email: string;
  settingsHref: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="user-menu-trigger" aria-label="Menu da conta">
          <span className="avatar" title={name}>
            {initials || "?"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-md font-semibold text-foreground">{name}</span>
          {email && (
            <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={settingsHref}>
            <Settings aria-hidden />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
          <ThemeToggle variant="menu-item" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logout} className="contents">
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut aria-hidden />
              Sair
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
