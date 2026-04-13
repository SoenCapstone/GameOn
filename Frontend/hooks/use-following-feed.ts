import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { createScopedLog } from "@/utils/logger";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import type {
  LeaguePostListResponse,
  TeamPostListResponse,
} from "@/types/board";
import { fetchUserNameMap } from "@/utils/board";
import type { HomeFeedItem } from "@/types/feed";
import type { LeagueMatch, TeamMatch } from "@/types/matches";
import type { TeamSummaryResponse } from "@/types/teams";
import {
  dedupeHomeFeedItems,
  isUpcomingFeedMatch,
  sortHomeFeedItems,
} from "@/utils/feed";
import { toast } from "@/utils/toast";
import { errorToString } from "@/utils/error";
import {
  buildMatchItem,
  buildPostItem,
  fetchLeagueSummaryMap,
  fetchTeamSummaryMap,
  normalizeLeagueSpace,
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

        const [
          teamPostsResults,
          teamMatchesResults,
          leaguePostsResults,
          leagueMatchesResults,
        ] = await Promise.all([
          Promise.allSettled(
            teamSpaces.map(async (space) => {
              const response = await api.get<TeamPostListResponse>(
                GO_TEAM_SERVICE_ROUTES.TEAM_POSTS(space.id),
                { params: { page: 0, size: 50 } },
              );
              return {
                space,
                posts: (response.data.posts ?? []).filter(
                  (post) => post.scope === "Everyone",
                ),
              };
            }),
          ),
          Promise.allSettled(
            teamSpaces.map(async (space) => {
              const response = await api.get<TeamMatch[]>(
                GO_TEAM_SERVICE_ROUTES.MATCHES(space.id),
              );
              return {
                space,
                matches: (response.data ?? []).filter((match) =>
                  isUpcomingFeedMatch(match),
                ),
              };
            }),
          ),
          Promise.allSettled(
            followedLeagueIds.map(async (leagueId) => {
              const response = await api.get<LeaguePostListResponse>(
                GO_LEAGUE_SERVICE_ROUTES.LEAGUE_POSTS(leagueId),
                { params: { page: 0, size: 50 } },
              );
              return {
                leagueId,
                posts: (response.data.items ?? []).filter(
                  (post) => post.scope === "Everyone",
                ),
              };
            }),
          ),
          Promise.allSettled(
            followedLeagueIds.map(async (leagueId) => {
              const response = await api.get<LeagueMatch[]>(
                GO_LEAGUE_SERVICE_ROUTES.MATCHES(leagueId),
              );
              return {
                leagueId,
                matches: (response.data ?? []).filter((match) =>
                  isUpcomingFeedMatch(match),
                ),
              };
            }),
          ),
        ]);

        const teamPostBuckets = teamPostsResults.flatMap((result) => {
          if (result.status === "fulfilled") {
            return [result.value];
          }
          log.warn("Failed to fetch team posts for following feed", result.reason);
          return [];
        });

        const teamMatchBuckets = teamMatchesResults.flatMap((result) => {
          if (result.status === "fulfilled") {
            return [result.value];
          }
          log.warn(
            "Failed to fetch team matches for following feed",
            result.reason,
          );
          return [];
        });

        const leaguePostBuckets = leaguePostsResults.flatMap((result) => {
          if (result.status === "fulfilled") {
            return [result.value];
          }
          log.warn(
            "Failed to fetch league posts for following feed",
            result.reason,
          );
          return [];
        });

        const leagueMatchBuckets = leagueMatchesResults.flatMap((result) => {
          if (result.status === "fulfilled") {
            return [result.value];
          }
          log.warn(
            "Failed to fetch league matches for following feed",
            result.reason,
          );
          return [];
        });

        const postAuthorIds = [
          ...new Set(
            [
              ...teamPostBuckets.flatMap((bucket) => bucket.posts),
              ...leaguePostBuckets.flatMap((bucket) => bucket.posts),
            ].map((post) => post.authorUserId),
          ),
        ];

        const userNameMap = await fetchUserNameMap(api, postAuthorIds, log);

        const allMatchTeamIds = [
          ...new Set(
            [
              ...teamMatchBuckets.flatMap((bucket) => bucket.matches),
              ...leagueMatchBuckets.flatMap((bucket) => bucket.matches),
            ].flatMap((match) => [match.homeTeamId, match.awayTeamId]),
          ),
        ];

        const followedTeamsList = followedTeamIds.map(
          (id) => followedTeamSummaryMap[id] ?? fallbackTeamSummary(id),
        );

        const teamSummaryMap = await fetchTeamSummaryMap(
          api,
          followedTeamsList,
          allMatchTeamIds,
          log,
        );

        const feedItems: HomeFeedItem[] = [
          ...teamPostBuckets.flatMap((bucket) =>
            bucket.posts.map((post) =>
              buildPostItem(post, bucket.space, userNameMap),
            ),
          ),
          ...leaguePostBuckets.flatMap((bucket) => {
            const league = leagueSummaryMap[bucket.leagueId] ?? {
              id: bucket.leagueId,
              name: "League",
              logoUrl: null,
            };
            const space = normalizeLeagueSpace(league);

            return bucket.posts.map((post) =>
              buildPostItem(post, space, userNameMap),
            );
          }),
          ...teamMatchBuckets.flatMap((bucket) =>
            bucket.matches.map((match) =>
              buildMatchItem(match, bucket.space, teamSummaryMap),
            ),
          ),
          ...leagueMatchBuckets.flatMap((bucket) => {
            const league = leagueSummaryMap[bucket.leagueId] ?? {
              id: bucket.leagueId,
              name: "League",
              logoUrl: null,
            };
            const space = normalizeLeagueSpace(league);

            return bucket.matches.map((match) =>
              buildMatchItem(match, space, teamSummaryMap),
            );
          }),
        ];

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
