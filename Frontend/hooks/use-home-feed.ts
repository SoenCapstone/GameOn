import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import type { AxiosInstance } from "axios";
import { createScopedLog } from "@/utils/logger";
import { fetchMyTeams } from "@/hooks/messages/api";
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
import type { LeagueListResponse } from "@/types/leagues";
import type { LeagueMatch, TeamMatch } from "@/types/matches";
import type { HomeFeedItem } from "@/types/feed";
import {
  dedupeHomeFeedItems,
  isUpcomingFeedMatch,
  sortHomeFeedItems,
} from "@/utils/feed";
import { toast } from "@/utils/toast";
import { errorToString } from "@/utils/error";
import {
  buildHomeItems,
  fetchLeagueSummaryMap,
  fetchTeamSummaryMap,
  normalizeTeamSpace,
} from "@/utils/home";

const log = createScopedLog("HomeFeed");

async function fetchMyLeagueIds(api: AxiosInstance) {
  try {
    const response = await api.get<LeagueListResponse>(
      GO_LEAGUE_SERVICE_ROUTES.ALL,
      {
        params: { my: true },
      },
    );

    return (response.data.items ?? []).map((league) => league.id);
  } catch (error) {
    log.warn("Failed to fetch user league memberships for home feed", error);
    return [];
  }
}

export function useHomeFeed() {
  const api = useAxiosWithClerk();
  const { userId } = useAuth();

  return useQuery<HomeFeedItem[]>({
    queryKey: ["home-feed", userId],
    enabled: Boolean(userId),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      try {
        log.info("Fetching home feed", { userId });

        const teams = await fetchMyTeams(api);
        const myLeagueIds = await fetchMyLeagueIds(api);

        const teamSpaces = teams.map(normalizeTeamSpace);
        const leagueIdsFromTeams = [
          ...new Set(
            teams
              .map((team) => team.leagueId)
              .filter((leagueId): leagueId is string => Boolean(leagueId)),
          ),
        ];
        const leagueIds = [...new Set([...leagueIdsFromTeams, ...myLeagueIds])];

        if (teamSpaces.length === 0 && leagueIds.length === 0) {
          log.info("Home feed empty because user has no teams or leagues", {
            userId,
          });
          return [];
        }

        log.info("Resolved home feed scope", {
          userId,
          teamCount: teamSpaces.length,
          teamLeagueCount: leagueIdsFromTeams.length,
          memberLeagueCount: myLeagueIds.length,
          leagueCount: leagueIds.length,
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
                posts: response.data.posts ?? [],
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
            leagueIds.map(async (leagueId) => {
              const response = await api.get<LeaguePostListResponse>(
                GO_LEAGUE_SERVICE_ROUTES.LEAGUE_POSTS(leagueId),
                { params: { page: 0, size: 50 } },
              );
              return {
                leagueId,
                posts: response.data.items ?? [],
              };
            }),
          ),
          Promise.allSettled(
            leagueIds.map(async (leagueId) => {
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
          log.warn("Failed to fetch team posts for feed", result.reason);
          return [];
        });

        const teamMatchBuckets = teamMatchesResults.flatMap((result) => {
          if (result.status === "fulfilled") {
            return [result.value];
          }
          log.warn("Failed to fetch team matches for feed", result.reason);
          return [];
        });

        const leaguePostBuckets = leaguePostsResults.flatMap((result) => {
          if (result.status === "fulfilled") {
            return [result.value];
          }
          log.warn("Failed to fetch league posts for feed", result.reason);
          return [];
        });

        const leagueMatchBuckets = leagueMatchesResults.flatMap((result) => {
          if (result.status === "fulfilled") {
            return [result.value];
          }
          log.warn("Failed to fetch league matches for feed", result.reason);
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

        const leagueSummaryMap = await fetchLeagueSummaryMap(
          api,
          leagueIds,
          log,
        );

        const allMatchTeamIds = [
          ...new Set(
            [
              ...teamMatchBuckets.flatMap((bucket) => bucket.matches),
              ...leagueMatchBuckets.flatMap((bucket) => bucket.matches),
            ].flatMap((match) => [match.homeTeamId, match.awayTeamId]),
          ),
        ];

        const teamSummaryMap = await fetchTeamSummaryMap(
          api,
          teams,
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

        log.info("Home feed assembled", {
          userId,
          itemCount: feed.length,
          postCount: feed.filter((item) => item.kind === "post").length,
          matchCount: feed.filter((item) => item.kind === "match").length,
        });

        return feed;
      } catch (error) {
        log.error("Failed to fetch home feed", { userId, error });
        toast.error("Failed to Load Feed", {
          description: errorToString(error),
        });
        throw error;
      }
    },
  });
}
