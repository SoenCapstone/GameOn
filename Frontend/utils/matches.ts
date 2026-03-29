import type {
  LeagueMatch,
  MatchStatusBadge,
  TeamMatch,
  TeamSummary,
} from "@/types/matches";
import { isToday } from "@/utils/date";

export function isPastMatch(startTime: string) {
  return new Date(startTime).getTime() < Date.now();
}

export function getMatchSection(
  startTime: string,
  status: string,
): "today" | "upcoming" | "past" {
  const now = new Date();
  const start = new Date(startTime);

  if (status === "COMPLETED") {
    return "past";
  }

  if (isCancelledMatchStatus(status)) {
    return "past";
  }

  const today: boolean = isToday(start);

  if (today) {
    return "today";
  }
  if (start.getTime() > now.getTime()) {
    return "upcoming";
  }
  return "past";
}

export function toBadgeStatus(status: string): MatchStatusBadge {
  if (status === "PENDING_TEAM_ACCEPTANCE") return "PENDING";
  if (isCancelledMatchStatus(status)) return "CANCELLED";
  if (status === "CONFIRMED") {
    return "CONFIRMED";
  }
  return "COMPLETED";
}

export function isCancelledMatchStatus(status: string) {
  return status === "DECLINED" || status === "CANCELLED";
}

export function sortUpcomingFirst<T extends { startTime: string }>(items: T[]) {
  return [...items].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

export function sortPastLatestFirst<T extends { startTime: string }>(
  items: T[],
) {
  return [...items].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
  );
}

export function formatMatchDateTime(isoDateTime: string) {
  const d = new Date(isoDateTime);
  const datePart = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const timePart = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} • ${timePart}`;
}

export function mapTeamsById(teams: TeamSummary[]) {
  return Object.fromEntries(teams.map((team) => [team.id, team]));
}

export function filterPendingTeamInvitesForOwner(
  matches: TeamMatch[],
  ownerTeamId: string,
) {
  return matches.filter(
    (match) =>
      match.status === "PENDING_TEAM_ACCEPTANCE" &&
      match.awayTeamId === ownerTeamId,
  );
}

export type MatchCardItem = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  requiresReferee: boolean;
  refereeUserId?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  homeName: string;
  awayName: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  sport: string;
  contextLabel: string;
  status: string;
  startTime: string;
  section: "today" | "upcoming" | "past";
  isPast: boolean;
  leagueId?: string;
};

export function buildMatchCards(
  matches: (LeagueMatch | TeamMatch)[],
  teamMap: Record<string, TeamSummary> | undefined,
  contextLabel: string | ((match: LeagueMatch | TeamMatch) => string),
): MatchCardItem[] {
  return matches.map((match) => {
    const home = teamMap?.[match.homeTeamId];
    const away = teamMap?.[match.awayTeamId];
    const hasScore = match.homeScore != null && match.awayScore != null;
    const resolvedStatus = hasScore ? "COMPLETED" : match.status;
    const section = getMatchSection(match.startTime, resolvedStatus);
    const resolvedContextLabel =
      typeof contextLabel === "function" ? contextLabel(match) : contextLabel;
    return {
      id: match.id,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      requiresReferee: match.requiresReferee,
      refereeUserId: match.refereeUserId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homeName: home?.name ?? "Home Team",
      awayName: away?.name ?? "Away Team",
      homeLogoUrl: home?.logoUrl,
      awayLogoUrl: away?.logoUrl,
      sport: match.sport,
      contextLabel: resolvedContextLabel,
      status: resolvedStatus,
      startTime: match.startTime,
      section,
      isPast: section === "past",
      leagueId: "leagueId" in match ? match.leagueId : undefined,
    };
  });
}

export function splitMatchSections<
  T extends {
    section: "today" | "upcoming" | "past";
    isPast: boolean;
    startTime: string;
  },
>(matchItems: T[]) {
  return {
    today: sortUpcomingFirst(
      matchItems.filter((item) => item.section === "today"),
    ),
    upcoming: sortUpcomingFirst(
      matchItems.filter((item) => item.section === "upcoming"),
    ),
    past: sortPastLatestFirst(matchItems.filter((item) => item.isPast)),
  };
}
