import { useCallback, useState } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { exploreMatchesQueryKey } from "@/constants/explore";
import type { LeagueMatch, TeamMatch } from "@/types/matches";
import type { ExploreMatchItem, ExploreMatchesParams } from "@/types/explore";
import {
  GO_EXPLORE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import {
  buildExploreMatchesBody,
  buildExploreMatchesQueryKey,
  mergeExploreMatchesResults,
} from "@/utils/explore";

function useExploreMatchesQuery<TData = ExploreMatchItem[]>(
  params: ExploreMatchesParams,
  options?: Omit<
    UseQueryOptions<ExploreMatchItem[], Error, TData>,
    "queryKey" | "queryFn" | "enabled"
  >,
) {
  const api = useAxiosWithClerk();
  const body = buildExploreMatchesBody(params);

  return useQuery<ExploreMatchItem[], Error, TData>({
    queryKey: body
      ? buildExploreMatchesQueryKey(body)
      : [...exploreMatchesQueryKey, "disabled"],
    queryFn: async () => {
      if (!body) {
        return [];
      }
      const [leagueResp, teamResp] = await Promise.all([
        api.post<LeagueMatch[]>(GO_EXPLORE_ROUTES.LEAGUE_MATCHES, body),
        api.post<TeamMatch[]>(GO_EXPLORE_ROUTES.TEAM_MATCHES, body),
      ]);
      return mergeExploreMatchesResults(leagueResp.data ?? [], teamResp.data ?? []);
    },
    enabled: body != null,
    retry: false,
    ...options,
  });
}

export function useExploreMatches(params: ExploreMatchesParams) {
  const {
    data: matches = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useExploreMatchesQuery(params);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  return {
    matches,
    isLoading,
    isError,
    error,
    isRefreshing,
    refresh,
  };
}
