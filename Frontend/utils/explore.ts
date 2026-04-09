import type { LeagueMatch, TeamMatch } from "@/types/matches";
import type {
  ExploreMatchesFilter,
  ExploreMatchesParams,
  ExploreMatchesResolvedParams,
} from "@/types/explore";

export function buildExploreMatchesBody(
  params: ExploreMatchesParams,
): ExploreMatchesResolvedParams | null {
  const { sport, latitude, longitude, rangeKm } = params;
  if (
    latitude == null ||
    longitude == null ||
    rangeKm == null ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    Number.isNaN(rangeKm) ||
    rangeKm <= 0
  ) {
    return null;
  }

  const trimmed = sport?.trim();
  return {
    latitude,
    longitude,
    rangeKm,
    ...(trimmed ? { sport: trimmed } : {}),
  };
}

export function exploreMatchesQueryKey(
  body: ExploreMatchesResolvedParams,
  filter: ExploreMatchesFilter = "all",
) {
  return [
    "explore-matches",
    filter,
    body.sport ?? "all",
    body.latitude,
    body.longitude,
    body.rangeKm,
  ] as const;
}

export function mergeExploreMatchesResults(
  leagueMatches: LeagueMatch[],
  teamMatches: TeamMatch[],
) {
  return [
    ...leagueMatches.map((match) => ({ kind: "league" as const, match })),
    ...teamMatches.map((match) => ({ kind: "team" as const, match })),
  ].sort(
    (a, b) =>
      new Date(a.match.startTime).getTime() -
      new Date(b.match.startTime).getTime(),
  );
}
