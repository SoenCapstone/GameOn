import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import {
  useAxiosWithClerk,
  GO_LEAGUE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { createScopedLog } from "@/utils/logger";

const log = createScopedLog("League Detail");

export function useLeagueDetail(id: string) {
  const [refreshing, setRefreshing] = useState(false);
  const api = useAxiosWithClerk();
  const { userId } = useAuth();

  const {
    data: league,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["leagues", id],
    queryFn: async () => {
      try {
        const resp = await api.get(`${GO_LEAGUE_SERVICE_ROUTES.ALL}/${id}`);
        return resp.data;
      } catch (err) {
        log.error("Failed to fetch league:", err);
        throw err;
      }
    },
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handleFollow = useCallback(() => {
    log.info(`Owner with id ${userId} has followed league with id ${id}`);
  }, [userId, id]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
    log.info("Page updated");
  }, [refetch]);

  const title = league?.name ?? (id ? `League ${id}` : "League");
  const isOwner = Boolean(userId && league && league.ownerUserId === userId);

  return {
    league,
    isLoading,
    refreshing,
    onRefresh,
    handleFollow,
    title,
    isOwner,
  };
}
