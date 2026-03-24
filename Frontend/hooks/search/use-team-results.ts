import { useQuery } from "@tanstack/react-query";
import type { SearchResult } from "@/constants/search";
import { fetchTeamResults, getSportLogo } from "@/utils/search";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";

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

export function useTeamResults(query: string, member?: boolean) {
  const api = useAxiosWithClerk();

  const queryResult = useQuery<TeamListResponse, Error>({
    queryKey: ["teams", query, member ?? false],
    queryFn: async () => fetchTeamResults(api, query, member),
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
