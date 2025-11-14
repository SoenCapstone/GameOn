import { useMemo } from "react";
import { SearchResult } from "@/components/browse/constants";
import { useTeamResults, filterLocalLeagues } from "@/components/browse/utils";

export function useTeamLeagueResults(query: string) {
  const teamQuery = useTeamResults(query);

  const combined = useMemo(() => {
    const teamItems = (teamQuery.data ?? []).slice();
    const leagueItems = filterLocalLeagues(query).slice();

    const merged = [...teamItems, ...leagueItems];
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
