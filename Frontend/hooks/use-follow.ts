import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { followKey } from "@/constants/follow";
import {
  followUrl,
  getFollowStatus,
  invalidateFollowQueries,
} from "@/utils/follow";
import type { FollowSpace } from "@/types/follow";
import { errorToString } from "@/utils/error";
import { toast } from "@/utils/toast";

export type { FollowSpace } from "@/types/follow";
export {
  followKey,
  followingLeaguesKey,
  followingTeamsKey,
} from "@/constants/follow";
export {
  followUrl,
  getFollowStatus,
  getFollowingLeagues,
  getFollowingTeams,
  getLeagueFollowStatus,
  getTeamFollowStatus,
  invalidateFollowQueries,
} from "@/utils/follow";

export function useFollow(space: FollowSpace, id: string) {
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const url = followUrl(space, id);
  const enabled = Boolean(id && userId);

  const {
    data: status,
    isLoading: isStatusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: followKey(space, id),
    queryFn: () => getFollowStatus(api, space, id),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Missing resource id");
      await api.post(url);
    },
    onSuccess: () => invalidateFollowQueries(queryClient, space, id),
    onError: (err) =>
      toast.error("Follow Failed", {
        description: errorToString(err),
      }),
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Missing resource id");
      await api.delete(url);
    },
    onSuccess: () => invalidateFollowQueries(queryClient, space, id),
    onError: (err) =>
      toast.error("Unfollow Failed", {
        description: errorToString(err),
      }),
  });

  return {
    following: status?.following ?? false,
    isStatusLoading,
    statusError,
    refetchStatus,
    follow: followMutation.mutateAsync,
    unfollow: unfollowMutation.mutateAsync,
    isFollowPending: followMutation.isPending,
    isUnfollowPending: unfollowMutation.isPending,
  };
}
