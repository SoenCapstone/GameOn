"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function LeagueRowActions({
  leagueId,
  leagueName,
  onDeleted,
}: {
  leagueId: string;
  leagueName: string;
  onDeleted: (leagueId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/leagues/${leagueId}`, {
        method: "DELETE",
      });

      const body = (await response.json().catch(() => null)) as
        | {
            error?: string;
          }
        | null;

      if (!response.ok) {
        toast.error("Failed to delete league", {
          description: body?.error ?? "Please try again.",
        });
        return;
      }

      toast.success("League deleted", {
        description: `${leagueName} was archived.`,
      });
      onDeleted(leagueId);
      setOpen(false);
    } catch {
      toast.error("Failed to delete league", {
        description: "Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="icon-sm"
          className="border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-red-100"
          onClick={() => setOpen(true)}
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          <span className="sr-only">Delete league</span>
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-500/10 text-red-200">
              {isDeleting ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-7 animate-spin"
                />
              ) : (
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-7" />
              )}
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this league?</AlertDialogTitle>
            <AlertDialogDescription>
              This follows the backend archive flow. {leagueName} will be soft
              deleted by setting its archive timestamp, not permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {isDeleting ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-5 animate-spin"
                />
              ) : (
                "Delete league"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
