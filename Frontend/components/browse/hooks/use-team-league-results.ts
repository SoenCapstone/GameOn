import { useMemo } from "react";
import { SearchResult, mockSearchResults } from "@/components/browse/constants";
import {
  useTeamResults,
  useLeagueResults,
  filterLocalLeagues,
} from "@/components/browse/utils";

export function useTeamLeagueResults(query: string, onlyMine?: boolean) {
  const teamQuery = useTeamResults(query, onlyMine);
  const leagueQuery = useLeagueResults(query, onlyMine);

  const combined = useMemo(() => {
    const teamItems = (teamQuery.data ?? []).slice();
    const mockTeamItems = mockSearchResults.filter((r) => r.type === "team");
    const leagueItems = (leagueQuery.data ?? []).slice();
    const mockLeagueItems = filterLocalLeagues(query).slice();

    // Include mocked teams for easy manual testing, but skip when running unit tests
    const includeMocks = process.env.NODE_ENV !== "test";
    const merged = includeMocks
      ? [...teamItems, ...mockTeamItems, ...leagueItems, ...mockLeagueItems]
      : [...teamItems, ...leagueItems];
    merged.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

    return merged;
  }, [teamQuery.data, leagueQuery.data, query]);

  return {
    data: combined,
    isLoading: teamQuery.isLoading || leagueQuery.isLoading,
    error: teamQuery.error ?? leagueQuery.error ?? null,
    refetch: async () => {
      await Promise.all([teamQuery.refetch(), leagueQuery.refetch()]);
    },
  } as {
    data: SearchResult[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
  };
}
