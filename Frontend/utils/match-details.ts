export type MatchContext = "team" | "league";

export function getTeamContextLeagueId(
  context: MatchContext,
  displayMatch: unknown,
): string {
  if (context !== "team" || !displayMatch) {
    return "";
  }

  if (
    typeof displayMatch === "object" &&
    "leagueId" in displayMatch &&
    typeof displayMatch.leagueId === "string"
  ) {
    return displayMatch.leagueId;
  }

  return "";
}

export function getContextLabel({
  context,
  leagueName,
  teamContextLeagueId,
  teamContextLeagueMap,
}: {
  context: MatchContext;
  leagueName?: string;
  teamContextLeagueId: string;
  teamContextLeagueMap?: Record<string, { name?: string }>;
}): string {
  if (context === "league") {
    return leagueName ?? "League Match";
  }

  if (teamContextLeagueId) {
    return teamContextLeagueMap?.[teamContextLeagueId]?.name ?? "League Match";
  }

  return "Team Match";
}

export function getIsMatchLoading({
  context,
  teamMatchLoading,
  teamMatchesLoading,
}: {
  context: MatchContext;
  teamMatchLoading: boolean;
  teamMatchesLoading: boolean;
}): boolean {
  if (context === "league") {
    return false;
  }

  return teamMatchLoading || teamMatchesLoading;
}

function normalizeScore(value: unknown): number | null | undefined {
  if (typeof value === "number" || value === null) {
    return value;
  }

  return undefined;
}

export function getMatchScores(displayMatch: unknown): {
  homeScore?: number | null;
  awayScore?: number | null;
} {
  if (!displayMatch || typeof displayMatch !== "object") {
    return {};
  }

  const homeScore =
    "homeScore" in displayMatch
      ? normalizeScore(displayMatch.homeScore)
      : undefined;
  const awayScore =
    "awayScore" in displayMatch
      ? normalizeScore(displayMatch.awayScore)
      : undefined;

  return { homeScore, awayScore };
}
