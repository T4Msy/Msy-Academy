"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markNotificationRead } from "./notificationActions";

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
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
    <div className="user-menu">
      <button
        type="button"
        className="notification-bell-trigger"
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <>
          <div className="popover-backdrop" onClick={() => setOpen(false)} />
          <div className="popover-pop user-menu-pop user-menu-pop--wide" role="menu">
            {notifications.length === 0 ? (
              <p className="field-hint popover-hint">Nenhuma notificação ainda.</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  className="popover-item notification-item"
                  role="menuitem"
                  onClick={() => onOpenNotification(n)}
                  style={{ opacity: pending ? 0.6 : 1 }}
                >
                  <div className="notification-item-head">
                    {!n.read_at && <span className="notification-dot" aria-hidden="true" />}
                    <span className="notification-item-title">{n.title}</span>
                  </div>
                  {n.body && <span className="field-hint">{n.body}</span>}
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
