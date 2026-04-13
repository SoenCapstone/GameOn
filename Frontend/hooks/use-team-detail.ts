import { useCallback, useState } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { createScopedLog } from "@/utils/logger";
import { useFollow } from "@/hooks/use-follow";

const log = createScopedLog("Team Detail");

export type TeamDetailResponse = Readonly<{
  id: string | null;
  name: string | null;
  sport: string | null;
  location: string | null;
  allowedRegions?: string[] | null;
  logoUrl: string | null;
  scope: string | null;
  privacy: "PRIVATE" | "PUBLIC";
  ownerUserId: string | null;
  totalMatches: number | null;
  minutesPlayed: number | null;
  totalPoints: number | null;
  winStreak: number | null;
  totalShotsOnTarget: number | null;
  totalFouls: number | null;
}>;

export function teamDetailQueryOptions(
  api: ReturnType<typeof useAxiosWithClerk>,
  id: string,
): UseQueryOptions<TeamDetailResponse> {
  return {
    queryKey: ["team", id],
    queryFn: async () => {
      try {
        const resp = await api.get(`${GO_TEAM_SERVICE_ROUTES.ALL}/${id}`);
        return resp.data as TeamDetailResponse;
      } catch (err) {
        log.error("Failed to fetch team:", err);
        throw err;
      }
    },
    enabled: Boolean(id),
    retry: false,
    refetchOnWindowFocus: false,
  };
}

export function useTeamDetail(id: string) {
  const [refreshing, setRefreshing] = useState(false);
  const api = useAxiosWithClerk();
  const { userId } = useAuth();

  const {
    data: team,
    isLoading,
    refetch,
  } = useQuery(teamDetailQueryOptions(api, id));

  const { data: membership } = useQuery({
    queryKey: ["team-membership", id, userId],
    queryFn: async () => {
      try {
        const resp = await api.get(
          `${GO_TEAM_SERVICE_ROUTES.ALL}/${id}/memberships/me`,
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

  const isMember = Boolean(membership);
  const isActiveMember = membership?.status === "ACTIVE";
  const role = membership?.role;
  const memStatus = membership?.status;
  const joinedAt = membership?.joinedAt;

  const canFollow = Boolean(
    userId && team && !isActiveMember && team.privacy === "PUBLIC",
  );
  const followTeamId = canFollow ? id : "";

  const followState = useFollow("team", followTeamId);

  const isFollowToolbarLoading =
    followState.isStatusLoading ||
    followState.isFollowPending ||
    followState.isUnfollowPending;

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
  const isOwner = Boolean(userId && team?.ownerUserId === userId);

  return {
    team,
    isLoading,
    refreshing,
    onRefresh,
    canFollow,
    isFollowing: followState.following,
    isFollowToolbarLoading,
    onFollow: followState.follow,
    onUnfollow: followState.unfollow,
    title,
    isOwner,
    isMember,
    isActiveMember,
    role,
    memStatus,
    joinedAt,
  };
}
