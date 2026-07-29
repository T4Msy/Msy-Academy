"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteTutorConversation, renameTutorConversation } from "./actions";

export function TutorConversationActions({
  conversationId,
  currentTitle,
  isActive,
}: {
  conversationId: string;
  currentTitle: string;
  isActive: boolean;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function rename() {
    startTransition(async () => {
      try {
        await renameTutorConversation(conversationId, title);
        setRenameOpen(false);
        toast.success("Conversa renomeada.");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Não foi possível renomear esta conversa.",
        );
      }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        await deleteTutorConversation(conversationId);
        setDeleteOpen(false);
        toast.success("Conversa excluída.");
        if (isActive) router.push("/aluno/tutor-ia");
        else router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Não foi possível excluir esta conversa.",
        );
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={`hover:text-brand-hover shrink-0 border-0! bg-transparent! text-brand-text shadow-none! transition-opacity hover:bg-brand-dim! ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`}
            aria-label={`Ações para ${currentTitle}`}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
            <Pencil aria-hidden /> Renomear
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="text-danger-text data-[highlighted]:bg-danger-dim data-[highlighted]:text-danger-text [&_svg]:text-danger-text!"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 aria-hidden /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renomear conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha um nome para encontrar este assunto depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={title}
            maxLength={80}
            disabled={pending}
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") rename();
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <Button type="button" disabled={pending || !title.trim()} onClick={rename}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação remove permanentemente esta conversa e todas as mensagens dela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className="border border-danger-border bg-danger-dim text-danger-text hover:bg-danger/15 [&_svg]:text-danger-text!"
              onClick={(event) => {
                event.preventDefault();
                remove();
              }}
            >
              {pending ? "Excluindo…" : "Excluir conversa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
