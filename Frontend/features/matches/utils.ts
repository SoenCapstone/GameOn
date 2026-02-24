import { LeagueMatch, MatchStatusBadge, TeamMatch, TeamSummary } from "@/features/matches/types";

export const PROVINCE_OPTIONS = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
] as const;

export function isPastMatch(startTime: string) {
  return new Date(startTime).getTime() < Date.now();
}

export function getMatchSection(
  startTime: string,
  endTime: string,
  status: string,
): "current" | "upcoming" | "past" {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (status !== "CANCELLED" && start <= now && now <= end) {
    return "current";
  }
  if (now < start) {
    return "upcoming";
  }
  return "past";
}

export function toBadgeStatus(status: string): MatchStatusBadge {
  if (status === "PENDING_TEAM_ACCEPTANCE") return "PENDING";
  if (status === "DECLINED" || status === "CANCELLED") return "CANCELLED";
  if (status === "CONFIRMED") {
    return "CONFIRMED";
  }
  return "COMPLETED";
}

export function buildStartEndIso(date: Date, startTime: Date, endTime: Date) {
  const start = new Date(date);
  start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
  const end = new Date(date);
  end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

export function isValidTimeRange(date: Date, startTime: Date, endTime: Date) {
  const { startTime: startIso, endTime: endIso } = buildStartEndIso(
    date,
    startTime,
    endTime,
  );
  return new Date(endIso).getTime() > new Date(startIso).getTime();
}

export function sortUpcomingFirst<T extends { startTime: string }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

export function sortPastLatestFirst<T extends { startTime: string }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
  );
}

export function formatMatchDateTime(isoDateTime: string) {
  const d = new Date(isoDateTime);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
  homeName: string;
  awayName: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  sport: string;
  contextLabel: string;
  status: string;
  startTime: string;
  section: "current" | "upcoming" | "past";
  isPast: boolean;
};

export function buildMatchCards(
  matches: (LeagueMatch | TeamMatch)[],
  teamMap: Record<string, TeamSummary> | undefined,
  contextLabel: string,
): MatchCardItem[] {
  return matches.map((match) => {
    const home = teamMap?.[match.homeTeamId];
    const away = teamMap?.[match.awayTeamId];
    const section = getMatchSection(match.startTime, match.endTime, match.status);
    return {
      id: match.id,
      homeName: home?.name ?? "Home Team",
      awayName: away?.name ?? "Away Team",
      homeLogoUrl: home?.logoUrl,
      awayLogoUrl: away?.logoUrl,
      sport: match.sport,
      contextLabel,
      status: match.status,
      startTime: match.startTime,
      section,
      isPast: section === "past",
    };
  });
}

export function splitMatchSections<T extends { section: "current" | "upcoming" | "past"; isPast: boolean; startTime: string }>(
  matchItems: T[],
) {
  return {
    current: sortUpcomingFirst(matchItems.filter((item) => item.section === "current")),
    upcoming: sortUpcomingFirst(matchItems.filter((item) => item.section === "upcoming")),
    past: sortPastLatestFirst(matchItems.filter((item) => item.isPast)),
  };
}
