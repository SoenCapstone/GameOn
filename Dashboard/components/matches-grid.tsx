"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Cancel01Icon,
  Clock01Icon,
  Loading03Icon,
  PinLocation01Icon,
  ShieldIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DashboardMatch = {
  id: string;
  matchType: "TEAM_MATCH" | "LEAGUE_MATCH";
  leagueId: string | null;
  leagueName: string | null;
  label: string;
  status: "PENDING_TEAM_ACCEPTANCE" | "CONFIRMED" | "DECLINED" | "CANCELLED";
  sport: string | null;
  startTime: string;
  endTime: string;
  venue: string | null;
  requiresReferee: boolean;
  referee: {
    userId: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  homeTeam: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  createdByUserId: string;
  cancelledByUserId: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeZone: "America/Toronto",
  }).format(new Date(value));
}

function formatTimeRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeStyle: "short",
    timeZone: "America/Toronto",
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

function getRefereeLabel(match: DashboardMatch) {
  if (!match.requiresReferee) {
    return "No referee required";
  }

  if (!match.referee) {
    return "Unassigned";
  }

  const fullName = [match.referee.firstName, match.referee.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || match.referee.email || "Assigned";
}

function formatSport(value: string | null) {
  if (!value) {
    return null;
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function getStatusBadgeCopy(status: DashboardMatch["status"]) {
  switch (status) {
    case "PENDING_TEAM_ACCEPTANCE":
      return "Pending";
    case "CONFIRMED":
      return "Confirmed";
    case "DECLINED":
      return "Declined";
    case "CANCELLED":
      return "Cancelled";
    default:
      return String(status).replaceAll("_", " ");
  }
}

function getStatusBadgeClassName(status: DashboardMatch["status"]) {
  switch (status) {
    case "CONFIRMED":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "PENDING_TEAM_ACCEPTANCE":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "DECLINED":
      return "border-red-500/20 bg-red-500/10 text-red-200";
    case "CANCELLED":
      return "border-red-500/20 bg-red-500/10 text-red-200";
    default:
      return "border-white/10 bg-white/5 text-muted-foreground";
  }
}

function MatchLogo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  return (
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="bg-muted/40 text-muted-foreground flex size-full items-center justify-center rounded-lg text-xs font-medium">
          {name.slice(0, 3).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function MatchesGrid({ initialMatches }: { initialMatches: DashboardMatch[] }) {
  const [matches, setMatches] = useState(initialMatches);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);

  async function handleCancel(match: DashboardMatch) {
    setPendingMatchId(match.id);

    try {
      const response = await fetch(`/api/matches/${match.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchType: match.matchType,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | {
            error?: string;
          }
        | null;

      if (!response.ok) {
        toast.error("Failed to cancel match", {
          description: body?.error ?? "Please try again.",
        });
        return;
      }

      setMatches((currentMatches) =>
        currentMatches.map((currentMatch) =>
          currentMatch.id === match.id
            ? {
                ...currentMatch,
                status: "CANCELLED",
                cancelReason: "Cancelled by GameOn Admin",
                cancelledAt: new Date().toISOString(),
              }
            : currentMatch,
        ),
      );

      toast.success("Match cancelled", {
        description: "The match was cancelled as GameOn Admin.",
      });
    } catch {
      toast.error("Failed to cancel match", {
        description: "Please try again.",
      });
    } finally {
      setPendingMatchId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-4 md:px-6 md:py-6">
      {matches.length === 0 ? (
        <div className="text-muted-foreground flex min-h-40 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-center">
          No matches found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match) => {
            const isPending = pendingMatchId === match.id;
            const isCancelled = match.status === "CANCELLED";

            return (
              <Card
                key={match.id}
                className="flex min-h-[320px] flex-col gap-0 border-white/10 bg-white/5 py-0"
              >
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{match.label}</p>
                      {formatSport(match.sport) ? (
                        <p className="text-muted-foreground text-sm">
                          {formatSport(match.sport)}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="outline" className={getStatusBadgeClassName(match.status)}>
                      {getStatusBadgeCopy(match.status)}
                    </Badge>
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <MatchLogo
                        name={match.homeTeam.name}
                        logoUrl={match.homeTeam.logoUrl}
                      />
                      <p className="truncate font-medium">{match.homeTeam.name}</p>
                    </div>
                    <span className="text-muted-foreground text-sm font-medium">vs</span>
                    <div className="flex min-w-0 items-center justify-end gap-3">
                      <p className="truncate text-right font-medium">
                        {match.awayTeam.name}
                      </p>
                      <MatchLogo
                        name={match.awayTeam.name}
                        logoUrl={match.awayTeam.logoUrl}
                      />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="text-muted-foreground size-4" />
                      <span>{formatDate(match.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="text-muted-foreground size-4" />
                      <span>{formatTimeRange(match.startTime, match.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={PinLocation01Icon} strokeWidth={2} className="text-muted-foreground size-4" />
                      <span className="truncate">{match.venue ?? "No venue"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={ShieldIcon} strokeWidth={2} className="text-muted-foreground size-4" />
                      <span className="truncate">{getRefereeLabel(match)}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-5">
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={isCancelled || isPending}
                      onClick={() => void handleCancel(match)}
                    >
                      {isPending ? (
                        <HugeiconsIcon
                          icon={Loading03Icon}
                          strokeWidth={2}
                          className="size-5 animate-spin"
                        />
                      ) : (
                        <>
                          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                          Cancel Match
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
    </div>
  );
}
