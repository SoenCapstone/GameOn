"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03Icon,
  Search01Icon,
  ShieldIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ModerationQueueItem = {
  id: string;
  userId: string;
  contentType: "message" | "team_post" | "league_post";
  contentId: string;
  contentPreview: string;
  createdAt: string;
  labels: string[];
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    imageUrl: string | null;
  };
};

function formatContentType(value: ModerationQueueItem["contentType"]) {
  switch (value) {
    case "team_post":
      return "Team post";
    case "league_post":
      return "League post";
    default:
      return "Message";
  }
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(new Date(value));
}

function formatLabel(label: string) {
  return label
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getDisplayName(item: ModerationQueueItem["user"]) {
  const fullName = [item.firstName, item.lastName].filter(Boolean).join(" ").trim();

  if (fullName) {
    return fullName;
  }

  return item.email ?? item.id;
}

function getInitials(item: ModerationQueueItem["user"]) {
  const initials = [item.firstName, item.lastName]
    .filter(Boolean)
    .map((value) => value!.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  if (initials) {
    return initials;
  }

  return (item.email ?? "U").charAt(0).toUpperCase();
}

async function fetchQueue() {
  const response = await fetch("/api/moderation/queue");

  if (!response.ok) {
    throw new Error("Failed to load moderation queue.");
  }

  const body = (await response.json()) as {
    queue: ModerationQueueItem[];
  };

  return body.queue;
}

export function ModerationQueue({
  initialQueue,
}: {
  initialQueue: ModerationQueueItem[];
}) {
  const [queue, setQueue] = useState(initialQueue);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [pendingActionType, setPendingActionType] = useState<
    "scan" | "dismiss" | "lock" | null
  >(null);

  async function refreshQueue() {
    setIsRefreshing(true);

    try {
      const nextQueue = await fetchQueue();
      setQueue(nextQueue);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleScan() {
    setPendingActionType("scan");

    try {
      const response = await fetch("/api/moderation/scan", {
        method: "POST",
      });

      const body = (await response.json().catch(() => null)) as
        | {
            error?: string;
            scannedCount?: number;
            warningCount?: number;
            queuedCount?: number;
          }
        | null;

      if (!response.ok) {
        toast.error("Failed to scan content", {
          description: body?.error ?? "Please try again.",
        });
        return;
      }

      await refreshQueue();

      toast.success("Moderation scan complete", {
        description: `Scanned ${body?.scannedCount ?? 0} items, sent ${
          body?.warningCount ?? 0
        } warning emails, and queued ${body?.queuedCount ?? 0} item(s).`,
      });
    } catch {
      toast.error("Failed to scan content", {
        description: "Please try again.",
      });
    } finally {
      setPendingActionType(null);
    }
  }

  async function handleQueueAction(
    itemId: string,
    action: "dismiss" | "lock",
  ) {
    setPendingActionId(itemId);
    setPendingActionType(action);

    try {
      const response = await fetch(`/api/moderation/queue/${itemId}/${action}`, {
        method: "POST",
      });

      const body = (await response.json().catch(() => null)) as
        | {
            error?: string;
          }
        | null;

      if (!response.ok) {
        toast.error(`Failed to ${action} item`, {
          description: body?.error ?? "Please try again.",
        });
        return;
      }

      const nextQueue = await fetchQueue();
      setQueue(nextQueue);

      toast.success(
        action === "dismiss" ? "Item dismissed" : "User locked",
        {
          description:
            action === "dismiss"
              ? "The flagged content was removed from the moderation queue."
              : "The user was locked and removed from the moderation queue.",
        },
      );
    } catch {
      toast.error(`Failed to ${action} item`, {
        description: "Please try again.",
      });
    } finally {
      setPendingActionId(null);
      setPendingActionType(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <Card className="border-white/10 bg-white/5 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Moderation Queue</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Scan recent messages and posts, then review repeat offenses here.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="min-w-36 h-11 justify-center"
            onClick={() => void handleScan()}
            disabled={pendingActionType === "scan" || isRefreshing}
          >
            {pendingActionType === "scan" ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                className="size-5 animate-spin"
              />
            ) : (
              <>
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
                Scan Content
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-muted-foreground flex h-24 items-center justify-center text-center">
              No flagged content in the moderation queue.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {queue.map((item) => {
                const isPending = pendingActionId === item.id;

                return (
                  <Card
                    key={item.id}
                    className="flex h-[360px] flex-col gap-0 border-white/10 bg-white/5 py-0"
                  >
                    <CardContent className="flex h-full flex-col p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar size="lg">
                            <AvatarImage
                              src={item.user.imageUrl ?? undefined}
                              alt={getDisplayName(item.user)}
                            />
                            <AvatarFallback>
                              {getInitials(item.user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {getDisplayName(item.user)}
                            </p>
                            <p className="text-muted-foreground truncate text-sm">
                              {item.user.email ?? "No email"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-white/10 bg-white/5"
                        >
                          {formatContentType(item.contentType)}
                        </Badge>
                      </div>

                      <div className="mt-4 flex-1 overflow-y-auto pr-1">
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {item.contentPreview}
                        </p>
                        <p className="text-muted-foreground mt-3 text-xs">
                          {formatCreatedAt(item.createdAt)}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.labels.map((label) => (
                          <Badge
                            key={label}
                            variant="outline"
                            className="border-white/10 bg-white/5"
                          >
                            {formatLabel(label)}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 border-white/10 bg-white/10 text-white hover:bg-white/20"
                          disabled={isPending}
                          onClick={() =>
                            void handleQueueAction(item.id, "dismiss")
                          }
                        >
                          {isPending && pendingActionType === "dismiss" ? (
                            <HugeiconsIcon
                              icon={Loading03Icon}
                              strokeWidth={2}
                              className="size-5 animate-spin"
                            />
                          ) : (
                            <>
                              <HugeiconsIcon
                                icon={Tick02Icon}
                                strokeWidth={2}
                              />
                              Dismiss
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 shadow-sm"
                          disabled={isPending}
                          onClick={() => void handleQueueAction(item.id, "lock")}
                        >
                          {isPending && pendingActionType === "lock" ? (
                            <HugeiconsIcon
                              icon={Loading03Icon}
                              strokeWidth={2}
                              className="size-5 animate-spin"
                            />
                          ) : (
                            <>
                              <HugeiconsIcon
                                icon={ShieldIcon}
                                strokeWidth={2}
                              />
                              Lock User
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
