import { useMemo } from "react";
import { SearchResult, mockSearchResults } from "@/components/browse/constants";
import { useTeamResults, filterLocalLeagues } from "@/components/browse/utils";

export function useTeamLeagueResults(query: string) {
  const teamQuery = useTeamResults(query);

  const combined = useMemo(() => {
    const teamItems = (teamQuery.data ?? []).slice();
    const mockTeamItems = mockSearchResults.filter((r) => r.type === "team");
    const leagueItems = filterLocalLeagues(query).slice();

    // Include mocked teams for testing
    const merged = [...teamItems, ...mockTeamItems, ...leagueItems];
    merged.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

    return merged;
  }, [teamQuery.data, query]);

  return {
    data: combined,
    isLoading: teamQuery.isLoading,
    error: teamQuery.error ?? null,
  } as {
    data: SearchResult[];
    isLoading: boolean;
    error: unknown;
  };
}
