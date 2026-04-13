import type { AxiosInstance } from "axios";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import type { LeaguePostResponse, TeamPostResponse } from "@/types/board";
import { mapToFrontendPost } from "@/utils/board";
import type { TeamSummaryResponse } from "@/types/teams";
import type { LeagueSummaryResponse } from "@/types/leagues";
import type { LeagueMatch, TeamMatch } from "@/types/matches";
import type {
  HomeFeedMatchItem,
  HomeFeedSpace,
  HomeFeedPostItem,
} from "@/types/feed";

export type HomeFeedAssemblyLog = {
  warn: (message: string, meta?: unknown) => void;
};

export function normalizeTeamSpace(team: TeamSummaryResponse): HomeFeedSpace {
  return {
    kind: "team",
    id: team.id,
    name: team.name,
    logoUrl: team.logoUrl ?? null,
    sport: team.sport ?? null,
  };
}

export function normalizeLeagueSpace(
  league: LeagueSummaryResponse,
): HomeFeedSpace {
  return {
    kind: "league",
    id: league.id,
    name: league.name,
    logoUrl: league.logoUrl ?? null,
    sport: league.sport ?? null,
  };
}

export async function fetchTeamSummaryMap(
  api: AxiosInstance,
  teams: TeamSummaryResponse[],
  teamIds: string[],
  log: HomeFeedAssemblyLog,
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

export async function fetchLeagueSummaryMap(
  api: AxiosInstance,
  leagueIds: string[],
  log: HomeFeedAssemblyLog,
) {
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

export function buildPostItem(
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

export function buildMatchItem(
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
