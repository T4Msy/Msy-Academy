"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import type { NotificationItem } from "@/components/shell/NotificationBell";
import { markNotificationRead } from "@/components/shell/notificationActions";

function relativeTime(value: string) {
  const elapsedSeconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  const ranges = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ] as const;

  let duration = elapsedSeconds;
  for (const [amount, unit] of ranges) {
    if (Math.abs(duration) < amount) return formatter.format(Math.round(duration), unit);
    duration /= amount;
  }
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function openNotification() {
    startTransition(async () => {
      if (!notification.read_at) await markNotificationRead(notification.id);
      if (notification.link) router.push(notification.link);
      else router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={openNotification}
      disabled={pending}
      className="group flex min-h-20 w-full items-start gap-3 rounded-md border border-border bg-card px-3.5 py-3 text-left outline-none transition-colors hover:border-border-hover hover:bg-card-2 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 active:bg-card-2"
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-sm bg-card-2 text-muted-foreground" aria-hidden>
        <Bell size={18} strokeWidth={1.8} />
        {!notification.read_at && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand ring-2 ring-card-2" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug text-foreground">{notification.title}</span>
        {notification.body && <span className="mt-1 block text-xs leading-normal text-muted-foreground">{notification.body}</span>}
        <time className="mt-1.5 block text-2xs text-subtle" dateTime={notification.created_at}>
          {relativeTime(notification.created_at)}
        </time>
      </span>
      {!notification.read_at && <span className="sr-only">Não lida</span>}
    </button>
  );
}

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {notifications.map((notification) => <NotificationRow key={notification.id} notification={notification} />)}
    </div>
  );
}
