import { SearchResult, mockSearchResults } from "@/components/browse/constants";
import { AxiosInstance } from "axios";
import { useQuery } from "@tanstack/react-query";
import { createScopedLog } from "@/utils/logger";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";

const log = createScopedLog("Browse");

// Map common sports to emoji as fallback for missing logos
export function mapSportToEmoji(sport?: string | null): string {
  const s = (sport || "").toLowerCase();
  switch (s) {
    case "soccer":
    case "football (soccer)":
    case "futbol":
      return "⚽";
    case "basketball":
      return "🏀";
    case "baseball":
      return "⚾";
    case "american football":
    case "nfl":
      return "🏈";
    case "hockey":
    case "ice hockey":
      return "🏒";
    case "tennis":
      return "🎾";
    case "rugby":
      return "🏉";
    case "volleyball":
      return "🏐";
    case "cricket":
      return "🏏";
    case "golf":
      return "⛳️";
    default:
      return "🏅";
  }
}

// Filter for mock leagues (until backend has leagues endpoint)
export function filterLocalLeagues(query: string): SearchResult[] {
  const q = (query || "").toLowerCase().trim();
  const leagues = mockSearchResults.filter((r) => r.type === "league");
  if (!q) return leagues;
  return leagues.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.subtitle.toLowerCase().includes(q) ||
      r.league?.toLowerCase().includes(q),
  );
}

type TeamSummaryResponse = {
  id: string;
  name: string;
  sport: string;
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

async function fetchTeamResults(
  api: AxiosInstance,
  query: string,
): Promise<TeamListResponse> {
  const params: Record<string, string> = { size: "50" };
  if (query && query.trim().length > 0) params.q = query.trim();

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

export function useTeamResults(query: string) {
  const api = useAxiosWithClerk();

  const queryResult = useQuery<TeamListResponse, Error>({
    queryKey: ["teams", query],
    queryFn: async () => fetchTeamResults(api, query),
    retry: 1,
  });

  const raw = queryResult.data ?? null;
  const items: TeamSummaryResponse[] = raw?.items ?? [];
  const data: SearchResult[] = items.map((t) => ({
    id: String(t.id),
    type: "team",
    name: t.name,
    subtitle: t.sport ? `${t.sport}` : "Team",
    sport: t.sport,
    logo: t.logoUrl || mapSportToEmoji(t.sport),
    league: "",
  }));

  return {
    data,
    raw,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    error: queryResult.error ?? null,
  } as {
    data: SearchResult[];
    raw: TeamListResponse | null;
    isLoading: boolean;
    isFetching: boolean;
    error: unknown;
  };
}

export { fetchTeamResults };
