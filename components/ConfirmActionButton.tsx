"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ConfirmActionButton({
  triggerLabel,
  title,
  description,
  confirmLabel,
  pendingLabel,
  successMessage,
  action,
  redirectTo,
  variant = "outline",
  size = "sm",
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  successMessage: string;
  action: () => Promise<void>;
  redirectTo?: string;
  variant?: "outline" | "destructive-ghost";
  size?: "xs" | "sm" | "default";
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function run() {
    startTransition(async () => {
      try {
        await action();
        setOpen(false);
        toast.success(successMessage);
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Algo deu errado.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant={variant} size={size} disabled={pending}>
          {pending ? pendingLabel : triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="border border-danger-border bg-danger-dim text-danger-text hover:bg-danger/15 focus-visible:ring-destructive/20"
            onClick={(event) => {
              event.preventDefault();
              run();
            }}
          >
            {pending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
