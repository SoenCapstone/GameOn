import { useQuery } from "@tanstack/react-query";
import type { SearchResult } from "@/constants/search";
import { fetchLeagueResults, getSportLogo } from "@/utils/search";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";

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

export function useLeagueResults(query: string, member?: boolean) {
  const api = useAxiosWithClerk();

  const queryResult = useQuery<LeagueListResponse, Error>({
    queryKey: ["leagues", query, member ?? false],
    queryFn: async () => fetchLeagueResults(api, query, member),
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
