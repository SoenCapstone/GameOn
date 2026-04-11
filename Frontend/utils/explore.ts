import type { LeagueMatch, Match, TeamMatch } from "@/types/matches";
import {
  exploreMatchesQueryKey,
  defaultExplorePreferences,
} from "@/constants/explore";
import type {
  ExploreMatchItem,
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

export function buildExploreMatchesQueryKey(
  body: ExploreMatchesResolvedParams,
  filter: ExploreMatchesFilter = "all",
) {
  return [
    ...exploreMatchesQueryKey,
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

export function getExploreMatches(rows: ExploreMatchItem[]): Match[] {
  return rows.map((row) => row.match);
}

export function filterExploreMatchesByVenue(
  matches: Match[],
  focusedVenue: string | null,
): Match[] {
  if (!focusedVenue) return matches;
  return matches.filter((m) => m.venueId === focusedVenue);
}

export function exploreTeamIds(matches: Match[]) {
  return Array.from(
    new Set(matches.flatMap((m) => [m.homeTeamId, m.awayTeamId])),
  );
}

export function exploreLeagueIds(matches: Match[]) {
  return Array.from(
    new Set(
      matches.flatMap((m) =>
        "leagueId" in m && m.leagueId ? [m.leagueId] : [],
      ),
    ),
  );
}

export function exploreMatchContextLabel(
  match: Match,
  leagues: Record<string, { name: string }> | undefined,
) {
  if ("leagueId" in match && match.leagueId) {
    return leagues?.[match.leagueId]?.name ?? "League Match";
  }
  return "Team Match";
}

export function exploreMapRegion(
  latitude: number | undefined,
  longitude: number | undefined,
  delta: number,
) {
  return {
    latitude: latitude ?? defaultExplorePreferences.coordinates.latitude,
    longitude: longitude ?? defaultExplorePreferences.coordinates.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export type MarkerHandle = {
  hideCallout?: () => void;
};

type MarkerRefMap = { current: Map<string, MarkerHandle> };

export function trackMarker(refs: MarkerRefMap, id: string, marker: unknown) {
  if (marker) refs.current.set(id, marker as MarkerHandle);
  else refs.current.delete(id);
}

export function hideMarkerCallouts(refs: MarkerRefMap) {
  refs.current.forEach((m) => m.hideCallout?.());
}
