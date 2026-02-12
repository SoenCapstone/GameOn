import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { createScopedLog } from "@/utils/logger";

const log = createScopedLog("Team Detail");

export function useTeamDetail(id: string) {
  const [refreshing, setRefreshing] = useState(false);
  const api = useAxiosWithClerk();
  const { userId } = useAuth();

  const {
    data: team,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      try {
        const resp = await api.get(`${GO_TEAM_SERVICE_ROUTES.ALL}/${id}`);
        return resp.data;
      } catch (err) {
        log.error("Failed to fetch team:", err);
        throw err;
      }
    },
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const {
    data: membership,
  } = useQuery({
    queryKey: ["team-membership", id, userId],
    queryFn: async () => {
      try {
        const resp = await api.get(
          `${GO_TEAM_SERVICE_ROUTES.ALL}/${id}/memberships/me`
        );
        return resp.data;
      } catch (err) {
        log.info("User is not a member of this team:", err);
        return null;
      }
    },
    enabled: Boolean(id) && Boolean(userId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handleFollow = useCallback(() => {
    log.info(`User with id ${userId} has followed team with id ${id}`);
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

  const title = team?.name ?? (id ? `Team ${id}` : "Team");
  const isOwner = Boolean(userId && team && team.ownerUserId === userId);
  const isMember = Boolean(membership);
  const isActiveMember = membership?.status === "ACTIVE";
  const role = membership?.role;
  const memStatus = membership?.status;
  const joinedAt = membership?.joinedAt;

  return {
    team,
    isLoading,
    refreshing,
    onRefresh,
    handleFollow,
    title,
    isOwner,
    isMember,
    isActiveMember,
    role,
    memStatus,
    joinedAt,
  };
}
