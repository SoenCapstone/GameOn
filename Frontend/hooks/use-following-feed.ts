import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { createScopedLog } from "@/utils/logger";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { fetchUserNameMap } from "@/utils/board";
import type { HomeFeedItem } from "@/types/feed";
import type { TeamSummaryResponse } from "@/types/teams";
import { dedupeHomeFeedItems, sortHomeFeedItems } from "@/utils/feed";
import { toast } from "@/utils/toast";
import { errorToString } from "@/utils/error";
import {
  buildHomeItems,
  collectFeedMatchTeamIds,
  collectFeedPostAuthorIds,
  fetchLeagueSummaryMap,
  fetchFeedBuckets,
  fetchTeamSummaryMap,
  normalizeTeamSpace,
} from "@/utils/home";
import { getFollowingLeagues, getFollowingTeams } from "@/utils/follow";
import { followingFeedQueryKey } from "@/constants/follow";

const log = createScopedLog("FollowingFeed");

export type FollowingFeedData = {
  items: HomeFeedItem[];
  /** True when the user follows at least one team or league (feed may still be empty). */
  followedAny: boolean;
};

function fallbackTeamSummary(teamId: string): TeamSummaryResponse {
  return {
    id: teamId,
    name: "Team",
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useFollowingFeed() {
  const api = useAxiosWithClerk();
  const { userId } = useAuth();

  return useQuery<FollowingFeedData>({
    queryKey: followingFeedQueryKey(userId),
    enabled: Boolean(userId),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      try {
        log.info("Fetching following feed", { userId });

        const [followedTeamIds, followedLeagueIds] = await Promise.all([
          getFollowingTeams(api),
          getFollowingLeagues(api),
        ]);

        const followedAny =
          followedTeamIds.length > 0 || followedLeagueIds.length > 0;

        if (!followedAny) {
          log.info("Following feed empty because user follows nothing", {
            userId,
          });
          return { items: [], followedAny: false };
        }

        const followedTeamSummaryMap = await fetchTeamSummaryMap(
          api,
          [],
          followedTeamIds,
          log,
        );

        const leagueSummaryMap = await fetchLeagueSummaryMap(
          api,
          followedLeagueIds,
          log,
        );

        const teamSpaces = followedTeamIds.map((teamId) =>
          normalizeTeamSpace(
            followedTeamSummaryMap[teamId] ?? fallbackTeamSummary(teamId),
          ),
        );

        log.info("Resolved following feed scope", {
          userId,
          teamCount: followedTeamIds.length,
          leagueCount: followedLeagueIds.length,
        });

        const {
          teamPostBuckets,
          teamMatchBuckets,
          leaguePostBuckets,
          leagueMatchBuckets,
        } = await fetchFeedBuckets({
          api,
          teamSpaces,
          leagueIds: followedLeagueIds,
          onlyEveryonePosts: true,
          label: "following feed",
          log,
        });

        const postAuthorIds = collectFeedPostAuthorIds({
          teamPostBuckets,
          leaguePostBuckets,
        });

        const userNameMap = await fetchUserNameMap(api, postAuthorIds, log);

        const allMatchTeamIds = collectFeedMatchTeamIds({
          teamMatchBuckets,
          leagueMatchBuckets,
        });

        const followedTeamsList = followedTeamIds.map(
          (id) => followedTeamSummaryMap[id] ?? fallbackTeamSummary(id),
        );

        const teamSummaryMap = await fetchTeamSummaryMap(
          api,
          followedTeamsList,
          allMatchTeamIds,
          log,
        );

        const feedItems: HomeFeedItem[] = buildHomeItems({
          teamPostBuckets,
          leaguePostBuckets,
          teamMatchBuckets,
          leagueMatchBuckets,
          userNameMap,
          leagueSummaryMap,
          teamSummaryMap,
        });

        const feed = sortHomeFeedItems(dedupeHomeFeedItems(feedItems));

        log.info("Following feed assembled", {
          userId,
          itemCount: feed.length,
          postCount: feed.filter((item) => item.kind === "post").length,
          matchCount: feed.filter((item) => item.kind === "match").length,
        });

        return { items: feed, followedAny: true };
      } catch (error) {
        log.error("Failed to fetch following feed", { userId, error });
        toast.error("Failed to Load Following", {
          description: errorToString(error),
        });
        throw error;
      }
    },
  });
}
