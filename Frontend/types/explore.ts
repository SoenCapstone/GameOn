import type { LeagueMatch, TeamMatch } from "@/types/matches";

export type ExploreMatchesFilter = "all" | "league" | "team";

export type ExploreMatchesParams = {
  sport?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rangeKm?: number | null;
  filter?: ExploreMatchesFilter;
};

export type ExploreMatchesResolvedParams = {
  latitude: number;
  longitude: number;
  rangeKm: number;
  sport?: string;
};

export type ExploreLeagueMatchItem = {
  kind: "league";
  match: LeagueMatch;
};

export type ExploreTeamMatchItem = {
  kind: "team";
  match: TeamMatch;
};

export type ExploreMatchItem = ExploreLeagueMatchItem | ExploreTeamMatchItem;
