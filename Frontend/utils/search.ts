import type { SearchResult } from "@/constants/search";
import { router } from "expo-router";
import { AxiosInstance } from "axios";
import { createScopedLog } from "@/utils/logger";
import { ImageSource } from "expo-image";
import { images } from "@/constants/images";
import {
  GO_TEAM_SERVICE_ROUTES,
  GO_LEAGUE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";

const log = createScopedLog("Search");

export function getSportLogo(sport?: string | null): ImageSource {
  const s = (sport || "").toLowerCase();
  switch (s) {
    case "soccer":
      return images.soccerLogo;
    case "basketball":
      return images.basketballLogo;
    case "volleyball":
      return images.volleyballLogo;
    default:
      return images.defaultLogo;
  }
}

type TeamSummaryResponse = {
  id: string;
  name: string;
  sport: string;
  location: string;
  leagueId?: string | null;
  slug: string;
  logoUrl?: string | null;
  privacy: string;
  maxRoster?: number | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

type TeamListResponse = {
  items: TeamSummaryResponse[];
  totalElements: number;
  page: number;
  size: number;
  hasNext: boolean;
};

type LeagueSummaryResponse = {
  id: string;
  name: string;
  sport: string;
  slug: string;
  logoUrl?: string | null;
  region?: string | null;
  level?: string | null;
  privacy?: string | null;
  seasonCount?: number | null;
  createdAt: string;
  updatedAt: string;
};

type LeagueListResponse = {
  items: LeagueSummaryResponse[];
  totalElements: number;
  page: number;
  size: number;
  hasNext: boolean;
};

async function fetchTeamResults(
  api: AxiosInstance,
  query: string,
  member?: boolean,
  sport?: string,
): Promise<TeamListResponse> {
  const params: Record<string, string | boolean> = { size: "50" };

  if (query && query.trim().length > 0) params.q = query.trim();
  if (member) params.my = member;
  if (sport && sport.trim().length > 0) params.sport = sport.trim();

  try {
    const resp = await api.get<TeamListResponse>(GO_TEAM_SERVICE_ROUTES.ALL, {
      params,
      timeout: 5000,
    });
    return resp.data;
  } catch (err) {
    log.warn("fetchTeamResults failed", err);
    throw err;
  }
}

async function fetchLeagueResults(
  api: AxiosInstance,
  query: string,
  member?: boolean,
): Promise<LeagueListResponse> {
  const params: Record<string, string | boolean> = { size: "50" };

  if (query && query.trim().length > 0) params.q = query.trim();
  if (member) params.my = member;

  try {
    const resp = await api.get<LeagueListResponse>(
      GO_LEAGUE_SERVICE_ROUTES.ALL,
      {
        params,
        timeout: 5000,
      },
    );
    return resp.data;
  } catch (err) {
    log.warn("fetchLeagueResults failed", err);
    throw err;
  }
}

export function filterPublicSearchResults(
  results: readonly SearchResult[],
): SearchResult[] {
  return results.filter((r) => r.privacy?.toLowerCase() === "public");
}

export function onSearchResultPress(result: SearchResult): void {
  if (result.type === "team") {
    router.push(`/teams/${result.id}`);
  } else if (result.type === "league") {
    router.push(`/leagues/${result.id}`);
  }
}

export { fetchTeamResults, fetchLeagueResults };
