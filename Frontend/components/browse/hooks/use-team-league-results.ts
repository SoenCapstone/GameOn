import { useMemo } from "react";
import { SearchResult, mockSearchResults } from "@/components/browse/constants";
import { useTeamResults, filterLocalLeagues } from "@/components/browse/utils";

export function useTeamLeagueResults(query: string) {
  const teamQuery = useTeamResults(query);

  const combined = useMemo(() => {
    const teamItems = (teamQuery.data ?? []).slice();
    const mockTeamItems = mockSearchResults.filter((r) => r.type === "team");
    const leagueItems = filterLocalLeagues(query).slice();

    // Include mocked teams for easy manual testing, but skip when running unit tests
    const includeMocks = process.env.NODE_ENV !== "test";
    const merged = includeMocks
      ? [...teamItems, ...mockTeamItems, ...leagueItems]
      : [...teamItems, ...leagueItems];
    merged.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

    return merged;
  }, [teamQuery.data, query]);

  return {
    data: combined,
    isLoading: teamQuery.isLoading,
    error: teamQuery.error ?? null,
    refetch: async () => {
      await teamQuery.refetch();
    },
  } as {
    data: SearchResult[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
  };
}
