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
  LeaguePostResponse,
  TeamPostListResponse,
  TeamPostResponse
} from "@/types/board";
import {
  fetchUserNameMap,
  mapToFrontendPost,
} from "@/utils/board";
import type { TeamSummaryResponse } from "@/types/teams";
import type { LeagueListResponse, LeagueSummaryResponse } from "@/types/leagues";
import type { LeagueMatch, TeamMatch } from "@/types/matches";
import type {
  HomeFeedItem,
  HomeFeedMatchItem,
  HomeFeedSpace,
  HomeFeedPostItem,
} from "@/types/feed";
import {
  dedupeHomeFeedItems,
  isUpcomingFeedMatch,
  sortHomeFeedItems,
} from "@/utils/feed";
import { toast } from "@/utils/toast";
import { errorToString } from "@/utils/error";

const log = createScopedLog("HomeFeed");

function normalizeTeamSpace(team: TeamSummaryResponse): HomeFeedSpace {
  return {
    kind: "team",
    id: team.id,
    name: team.name,
    logoUrl: team.logoUrl ?? null,
    sport: team.sport ?? null,
  };
}

function normalizeLeagueSpace(league: LeagueSummaryResponse): HomeFeedSpace {
  return {
    kind: "league",
    id: league.id,
    name: league.name,
    logoUrl: league.logoUrl ?? null,
    sport: league.sport ?? null,
  };
}

async function fetchTeamSummaryMap(
  api: AxiosInstance,
  teams: TeamSummaryResponse[],
  teamIds: string[],
) {
  const baseMap = new Map<string, TeamSummaryResponse>();

  for (const team of teams) {
    baseMap.set(team.id, team);
  }

  const missingTeamIds = teamIds.filter((teamId) => !baseMap.has(teamId));
  if (missingTeamIds.length === 0) {
    return Object.fromEntries(baseMap.entries()) as Record<
      string,
      TeamSummaryResponse
    >;
  }

  const missingTeams = await Promise.allSettled(
    missingTeamIds.map(async (teamId) => {
      try {
        const response = await api.get<TeamSummaryResponse>(
          `${GO_TEAM_SERVICE_ROUTES.ALL}/${teamId}`,
        );
        return [teamId, response.data] as const;
      } catch (error) {
        log.warn("Failed to fetch team summary for feed", { teamId, error });
        return [
          teamId,
          {
            id: teamId,
            name: "Team",
            archived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as TeamSummaryResponse,
        ] as const;
      }
    }),
  );

  for (const result of missingTeams) {
    if (result.status === "fulfilled") {
      baseMap.set(result.value[0], result.value[1]);
    }
  }

  return Object.fromEntries(baseMap.entries()) as Record<
    string,
    TeamSummaryResponse
  >;
}

async function fetchLeagueSummaryMap(api: AxiosInstance, leagueIds: string[]) {
  const results = await Promise.allSettled(
    leagueIds.map(async (leagueId) => {
      try {
        const response = await api.get<LeagueSummaryResponse>(
          GO_LEAGUE_SERVICE_ROUTES.GET(leagueId),
        );
        return [leagueId, response.data] as const;
      } catch (error) {
        log.warn("Failed to fetch league summary for feed", {
          leagueId,
          error,
        });
        return [
          leagueId,
          { id: leagueId, name: "League", logoUrl: null },
        ] as const;
      }
    }),
  );

  return Object.fromEntries(
    results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    ),
  ) as Record<string, LeagueSummaryResponse>;
}

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

function buildPostItem(
  post: TeamPostResponse | LeaguePostResponse,
  space: HomeFeedSpace,
  userNameMap: Record<string, string>,
): HomeFeedPostItem {
  const frontendPost = mapToFrontendPost(
    {
      id: post.id,
      authorUserId: post.authorUserId,
      title: post.title,
      body: post.body,
      scope: post.scope,
      createdAt: post.createdAt,
    },
    userNameMap,
  );

  return {
    kind: "post",
    id: frontendPost.id,
    createdAt: frontendPost.createdAt,
    space,
    post: frontendPost,
  };
}

function buildMatchItem(
  match: TeamMatch | LeagueMatch,
  space: HomeFeedSpace,
  teamMap: Record<string, TeamSummaryResponse>,
): HomeFeedMatchItem {
  const homeTeam = teamMap[match.homeTeamId];
  const awayTeam = teamMap[match.awayTeamId];
  const hasScore = match.homeScore != null && match.awayScore != null;

  return {
    kind: "match",
    id: match.id,
    createdAt: match.createdAt,
    space,
    match,
    contextLabel: space.kind === "team" ? "Team Match" : space.name,
    homeName: homeTeam?.name ?? "Home Team",
    awayName: awayTeam?.name ?? "Away Team",
    homeLogoUrl: homeTeam?.logoUrl ?? null,
    awayLogoUrl: awayTeam?.logoUrl ?? null,
    sport: match.sport,
    status: hasScore ? "COMPLETED" : match.status,
    startTime: match.startTime,
    homeScore: match.homeScore ?? null,
    awayScore: match.awayScore ?? null,
    isPast: false,
  };
}

export function useHomeFeed() {
  const api = useAxiosWithClerk();
  const { userId } = useAuth();

  return useQuery<HomeFeedItem[]>({
    queryKey: ["home-feed", userId],
    enabled: Boolean(userId),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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

        const leagueSummaryMap = await fetchLeagueSummaryMap(api, leagueIds);

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

        log.info("Home feed assembled", {
          userId,
          itemCount: feed.length,
          postCount: feed.filter((item) => item.kind === "post").length,
          matchCount: feed.filter((item) => item.kind === "match").length,
        });

        return feed;
      } catch (error) {
        log.error("Failed to fetch home feed", { userId, error });
        toast.error("Failed to load feed", {
          description: errorToString(error),
        });
        throw error;
      }
    },
  });
}
