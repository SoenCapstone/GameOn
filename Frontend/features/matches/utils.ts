import { MatchStatusBadge, TeamMatch, TeamSummary } from "@/features/matches/types";

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
