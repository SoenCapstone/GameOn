import { useMemo } from "react";
import { SearchResult } from "@/components/browse/constants";
import { useTeamResults, useLeagueResults } from "@/components/browse/utils";

export function useTeamLeagueResults(query: string, onlyMine?: boolean) {
  const teamQuery = useTeamResults(query, onlyMine);
  const leagueQuery = useLeagueResults(query, onlyMine);

  const combined = useMemo(() => {
    const teamItems = (teamQuery.data ?? []).slice();
    const remoteLeagueItems = (leagueQuery.data ?? []).slice();
    const merged = [...teamItems, ...remoteLeagueItems];
    merged.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

    return merged;
  }, [teamQuery.data, leagueQuery.data]);

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
