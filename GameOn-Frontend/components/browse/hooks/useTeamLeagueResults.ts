import { useMemo } from "react";
import { SearchResult } from "@/components/browse/constants";
import { useTeamResults, filterLocalLeagues } from "@/components/browse/utils";

export function useTeamLeagueResults(query: string) {
  const teamQuery = useTeamResults(query);

  const combined = useMemo(() => {
    const teamItems = (teamQuery.data ?? []).slice().reverse();
    const leagueItems = filterLocalLeagues(query);
    return [...teamItems, ...leagueItems];
  }, [teamQuery.data, query]);

  return {
    data: combined,
    isLoading: teamQuery.isLoading,
    error: teamQuery.error ?? null,
  } as {
    data: SearchResult[];
    isLoading: boolean;
    error: unknown | null;
  };
}
