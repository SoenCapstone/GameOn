"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Loading03Icon,
  MoreVerticalCircle01Icon,
  LogoutIcon,
  ShieldIcon,
} from "@hugeicons/core-free-icons";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserRowActionsProps = {
  userId: string;
  displayName: string;
  isLocked: boolean;
  onDeleted: (userId: string) => void;
  onChanged: () => void;
};

export function UserRowActions({
  userId,
  displayName,
  isLocked,
  onDeleted,
  onChanged,
}: UserRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"lock" | "unlock" | "delete" | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function handleMenuOpenChange(nextOpen: boolean) {
    setMenuOpen(nextOpen);

    if (!nextOpen) {
      window.setTimeout(() => {
        triggerRef.current?.blur();
      }, 0);
    }
  }

  async function runAction(
    action: "lock" | "unlock" | "delete",
    options?: { onSuccess?: () => void },
  ) {
    setPendingAction(action);

    try {
      const response = await fetch(
        action === "delete" ? `/api/users/${userId}` : `/api/users/${userId}/${action}`,
        {
          method: action === "delete" ? "DELETE" : "POST",
        },
      );

      const body = (await response.json().catch(() => null)) as
        | {
            error?: string;
          }
        | null;

      if (!response.ok) {
        toast.error(`Failed to ${action} user`, {
          description: body?.error ?? "Please try again.",
        });
        return;
      }

      if (action === "delete") {
        toast.success("User deleted", {
          description: `${displayName} was removed from Clerk and the dashboard.`,
        });
        onDeleted(userId);
      } else {
        toast.success(action === "lock" ? "User locked" : "User unlocked", {
          description:
            action === "lock"
              ? `${displayName} was locked and their sessions were revoked.`
              : `${displayName} was unlocked.`,
        });
        onChanged();
      }

      options?.onSuccess?.();
    } catch {
      toast.error(`Failed to ${action} user`, {
        description: "Please try again.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className="text-muted-foreground data-[state=open]:bg-muted focus-visible:ring-0 focus-visible:border-transparent flex size-8 rounded-full shadow-none"
          >
            <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} />
            <span className="sr-only">Open user actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {isLocked ? (
            <DropdownMenuItem
              disabled={pendingAction !== null}
              onSelect={(event) => {
                event.preventDefault();
                setMenuOpen(false);
                void runAction("unlock");
              }}
            >
              <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} />
              Unlock user
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => {
                setMenuOpen(false);
                setLockOpen(true);
              }}
            >
              <HugeiconsIcon icon={ShieldIcon} strokeWidth={2} />
              Lock user
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={lockOpen} onOpenChange={setLockOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              {pendingAction === "lock" ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-7 animate-spin"
                />
              ) : (
                <HugeiconsIcon icon={ShieldIcon} strokeWidth={2} className="size-7" />
              )}
            </AlertDialogMedia>
            <AlertDialogTitle>Lock this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will lock {displayName} in Clerk and revoke their active sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction === "lock"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pendingAction === "lock"}
              onClick={(event) => {
                event.preventDefault();
                void runAction("lock", {
                  onSuccess: () => setLockOpen(false),
                });
              }}
            >
              {pendingAction === "lock" ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-5 animate-spin"
                />
              ) : (
                "Lock user"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              {pendingAction === "delete" ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-7 animate-spin"
                />
              ) : (
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-7" />
              )}
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {displayName} from Clerk and removes them from the
              dashboard database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction === "delete"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pendingAction === "delete"}
              onClick={(event) => {
                event.preventDefault();
                void runAction("delete", {
                  onSuccess: () => setDeleteOpen(false),
                });
              }}
            >
              {pendingAction === "delete" ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-5 animate-spin"
                />
              ) : (
                "Delete user"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
