import { SearchResult } from "@/components/browse/constants";
import { AxiosInstance } from "axios";
import { useQuery } from "@tanstack/react-query";
import { createScopedLog } from "@/utils/logger";
import { ImageSource } from "expo-image";
import { images } from "@/constants/images";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
  GO_LEAGUE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";

const log = createScopedLog("Browse");

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
  onlyMine?: boolean,
  sport?: string,
): Promise<TeamListResponse> {
  const params: Record<string, string | boolean> = { size: "50" };

  if (query && query.trim().length > 0) params.q = query.trim();
  if (onlyMine) params.my = onlyMine;
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
  onlyMine?: boolean,
): Promise<LeagueListResponse> {
  const params: Record<string, string | boolean> = { size: "50" };

  if (query && query.trim().length > 0) params.q = query.trim();
  if (onlyMine) params.my = onlyMine;

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

export function useTeamResults(query: string, onlyMine?: boolean) {
  const api = useAxiosWithClerk();

  const queryResult = useQuery<TeamListResponse, Error>({
    queryKey: ["teams", query, onlyMine ?? false],
    queryFn: async () => fetchTeamResults(api, query, onlyMine),
    retry: false,
  });

  const raw = queryResult.data ?? null;
  const items: TeamSummaryResponse[] = raw?.items ?? [];
  const data: SearchResult[] = items.map((t) => ({
    id: String(t.id),
    type: "team",
    name: t.name,
    subtitle: t.sport ? `${t.sport}` : "Team",
    sport: t.sport,
    logo: t.logoUrl ? { uri: t.logoUrl } : getSportLogo(t.sport),
    league: "",
    location: t.location,
    privacy: t.privacy ?? undefined,
  }));

  return {
    data,
    raw,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    error: queryResult.error ?? null,
    refetch: async () => {
      await queryResult.refetch();
    },
  } as {
    data: SearchResult[];
    raw: TeamListResponse | null;
    isLoading: boolean;
    isFetching: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
  };
}

export function useLeagueResults(query: string, onlyMine?: boolean) {
  const api = useAxiosWithClerk();

  const queryResult = useQuery<LeagueListResponse, Error>({
    queryKey: ["leagues", query, onlyMine ?? false],
    queryFn: async () => fetchLeagueResults(api, query, onlyMine),
    retry: false,
  });

  const raw = queryResult.data ?? null;
  const items: LeagueSummaryResponse[] = raw?.items ?? [];
  const data: SearchResult[] = items.map((league) => {
    const subtitle = league.region || league.sport || "League";
    return {
      id: String(league.id),
      type: "league",
      name: league.name,
      subtitle,
      sport: league.sport,
      logo: league.logoUrl
        ? { uri: league.logoUrl }
        : getSportLogo(league.sport),
      league: "",
      location: league.region ?? "",
      privacy: league.privacy ?? undefined,
    };
  });

  return {
    data,
    raw,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    error: queryResult.error ?? null,
    refetch: async () => {
      await queryResult.refetch();
    },
  } as {
    data: SearchResult[];
    raw: LeagueListResponse | null;
    isLoading: boolean;
    isFetching: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
  };
}

export { fetchTeamResults, fetchLeagueResults };
