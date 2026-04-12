import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  useAxiosWithClerk,
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
    queryKey: ["league", id],
    queryFn: async () => {
      try {
        const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.GET(id));
        return resp.data;
      } catch (err) {
        log.error("Failed to fetch league:", err);
        throw err;
      }
    },
    enabled: Boolean(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: myLeagueTeams = [] } = useQuery({
    queryKey: ["league-memberships", id, userId],
    queryFn: async () => {
      try {
        const resp = await api.get(
          `${GO_LEAGUE_SERVICE_ROUTES.GET(id)}/memberships/me`,
        );
        return resp.data;
      } catch (err) {
        log.info("User is not part of any team in this league:", err);
        return [];
      }
    },
    enabled: Boolean(id) && Boolean(userId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const {
    data: leagueTeamsData = [],
    isLoading: isLeagueTeamsLoading,
    error: leagueTeamsError,
    refetch: refetchLeagueTeams,
  } = useQuery({
    queryKey: ["league-teams", id],
    queryFn: async () => {
      try {
        const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.TEAMS(id));
        return resp.data;
      } catch (err) {
        log.error("Failed to fetch league teams:", err);
        throw err;
      }
    },
    enabled: Boolean(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: organizersData = [] } = useQuery<{ userId: string }[]>({
    queryKey: ["league-organizers", id],
    queryFn: async () => {
      try {
        const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.ORGANIZERS(id));
        return resp.data ?? [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(id) && Boolean(userId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const leagueTeams = Array.isArray(leagueTeamsData) ? leagueTeamsData : [];

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([refetch(), refetchLeagueTeams()]);
    } finally {
      setRefreshing(false);
    }
    log.info("League page updated");
  }, [refetch, refetchLeagueTeams]);

  const handleFollow = useCallback(() => {
    log.info(`User with id ${userId} has followed league with id ${id}`);
  }, [userId, id]);

  const title = league?.name ?? (id ? `League ${id}` : "League");
  const isOwner = Boolean(userId && league?.ownerUserId === userId);
  const isOrganizer = Boolean(
    userId && organizersData.some((o) => o.userId === userId),
  );
  const isMember = myLeagueTeams.length > 0;

  return {
    league,
    isLoading,
    refreshing,
    onRefresh,
    handleFollow,
    title,
    isOwner,
    myLeagueTeams,
    isMember,
    leagueTeams,
    isLeagueTeamsLoading,
    leagueTeamsError,
    refetchLeagueTeams,
    isOrganizer,
  };
}
