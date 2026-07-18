"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { markNotificationRead } from "./notificationActions";

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

/** Sino de notificações do Topbar — Radix Popover (foco/Esc/dismiss corretos),
 *  badge de não-lidas preservado do design anterior (classes do shell). */
export function NotificationBell({
  notifications,
  environment,
}: {
  notifications: NotificationItem[];
  environment: "PROFESSOR" | "ALUNO";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  function onOpenNotification(n: NotificationItem) {
    if (!n.read_at) {
      startTransition(async () => {
        await markNotificationRead(n.id);
        router.refresh();
      });
    }
    setOpen(false);
  }

  return (
    <>
      <Link
        href={`/notificacoes?origem=${environment.toLowerCase()}`}
        className="notification-bell-trigger notification-bell-mobile"
        aria-label={`Abrir notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
      >
        <Bell size={18} strokeWidth={1.8} aria-hidden />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </Link>

      <span className="notification-bell-desktop">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="notification-bell-trigger"
              aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
            >
              <Bell size={18} strokeWidth={1.8} aria-hidden />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-1.5">
            {notifications.length === 0 ? (
              <p className="px-2.5 py-3 text-sm text-muted-foreground">Nenhuma notificação ainda.</p>
            ) : (
              <div className="flex max-h-96 flex-col overflow-y-auto" role="menu">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "#"}
                    className={`flex flex-col gap-0.5 rounded-sm px-2.5 py-2 outline-none transition-colors hover:bg-accent focus-visible:bg-accent ${pending ? "opacity-60" : ""}`}
                    role="menuitem"
                    onClick={() => onOpenNotification(n)}
                  >
                    <span className="flex items-center gap-2">
                      {!n.read_at && <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />}
                      <span className="truncate text-md font-semibold text-foreground">{n.title}</span>
                    </span>
                    {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
                  </Link>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </span>
    </>
  );
}
