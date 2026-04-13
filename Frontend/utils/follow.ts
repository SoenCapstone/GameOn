import type { AxiosInstance } from "axios";
import type { QueryClient } from "@tanstack/react-query";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import type {
  FollowSpace,
  LeagueFollowStatusResponse,
  MyLeagueFollowingResponse,
  MyTeamFollowingResponse,
  TeamFollowStatusResponse,
} from "@/types/follow";
import {
  followingFeedQueryRoot,
  followKey,
  followingLeaguesKey,
  followingTeamsKey,
} from "@/constants/follow";

export function followUrl(space: FollowSpace, id: string): string {
  return space === "team"
    ? GO_TEAM_SERVICE_ROUTES.TEAM_FOLLOW(id)
    : GO_LEAGUE_SERVICE_ROUTES.LEAGUE_FOLLOW(id);
}

export async function getFollowingTeams(api: AxiosInstance): Promise<string[]> {
  const resp = await api.get<MyTeamFollowingResponse>(
    GO_TEAM_SERVICE_ROUTES.TEAMS_ME_FOLLOWING,
  );
  return resp.data.teamIds ?? [];
}

export async function getFollowingLeagues(
  api: AxiosInstance,
): Promise<string[]> {
  const resp = await api.get<MyLeagueFollowingResponse>(
    GO_LEAGUE_SERVICE_ROUTES.LEAGUES_ME_FOLLOWING,
  );
  return resp.data.leagueIds ?? [];
}

export async function getTeamFollowStatus(
  api: AxiosInstance,
  teamId: string,
): Promise<TeamFollowStatusResponse> {
  const resp = await api.get<TeamFollowStatusResponse>(
    GO_TEAM_SERVICE_ROUTES.TEAM_FOLLOW(teamId),
  );
  return resp.data;
}

export async function getLeagueFollowStatus(
  api: AxiosInstance,
  leagueId: string,
): Promise<LeagueFollowStatusResponse> {
  const resp = await api.get<LeagueFollowStatusResponse>(
    GO_LEAGUE_SERVICE_ROUTES.LEAGUE_FOLLOW(leagueId),
  );
  return resp.data;
}

export async function getFollowStatus(
  api: AxiosInstance,
  space: FollowSpace,
  id: string,
): Promise<TeamFollowStatusResponse | LeagueFollowStatusResponse> {
  return space === "team"
    ? getTeamFollowStatus(api, id)
    : getLeagueFollowStatus(api, id);
}

export function invalidateFollowQueries(
  queryClient: QueryClient,
  space: FollowSpace,
  id: string,
): void {
  void queryClient.invalidateQueries({ queryKey: followKey(space, id) });
  void queryClient.invalidateQueries({
    queryKey: space === "team" ? followingTeamsKey : followingLeaguesKey,
  });
  void queryClient.invalidateQueries({
    queryKey: [followingFeedQueryRoot],
  });
}
