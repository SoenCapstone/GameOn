import type { AxiosInstance } from "axios";
import { QueryClient } from "@tanstack/react-query";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import {
  followUrl,
  getFollowStatus,
  getFollowingLeagues,
  getFollowingTeams,
  getLeagueFollowStatus,
  getTeamFollowStatus,
  invalidateFollowQueries,
} from "@/utils/follow";
import {
  followKey,
  followingLeaguesKey,
  followingTeamsKey,
} from "@/constants/follow";

/** Minimal axios surface used by follow utils; asserted where full AxiosInstance is required. */
function createGetMock(
  get: jest.MockedFunction<AxiosInstance["get"]>,
): AxiosInstance {
  return { get } as unknown as AxiosInstance;
}

describe("followUrl", () => {
  it("returns team follow URL for team space", () => {
    expect(followUrl("team", "tid")).toBe(
      GO_TEAM_SERVICE_ROUTES.TEAM_FOLLOW("tid"),
    );
  });

  it("returns league follow URL for league space", () => {
    expect(followUrl("league", "lid")).toBe(
      GO_LEAGUE_SERVICE_ROUTES.LEAGUE_FOLLOW("lid"),
    );
  });
});

describe("getTeamFollowStatus", () => {
  it("GETs team follow status and returns body", async () => {
    const get = jest.fn().mockResolvedValue({ data: { following: true } });
    const api = createGetMock(get);

    await expect(getTeamFollowStatus(api, "team-1")).resolves.toEqual({
      following: true,
    });
    expect(get).toHaveBeenCalledWith(GO_TEAM_SERVICE_ROUTES.TEAM_FOLLOW("team-1"));
  });
});

describe("getLeagueFollowStatus", () => {
  it("GETs league follow status and returns body", async () => {
    const get = jest.fn().mockResolvedValue({ data: { following: false } });
    const api = createGetMock(get);

    await expect(getLeagueFollowStatus(api, "league-1")).resolves.toEqual({
      following: false,
    });
    expect(get).toHaveBeenCalledWith(
      GO_LEAGUE_SERVICE_ROUTES.LEAGUE_FOLLOW("league-1"),
    );
  });
});

describe("getFollowStatus", () => {
  it("delegates to team helper when space is team", async () => {
    const get = jest.fn().mockResolvedValue({ data: { following: true } });
    const api = createGetMock(get);

    await expect(getFollowStatus(api, "team", "t1")).resolves.toEqual({
      following: true,
    });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("delegates to league helper when space is league", async () => {
    const get = jest.fn().mockResolvedValue({ data: { following: false } });
    const api = createGetMock(get);

    await expect(getFollowStatus(api, "league", "l1")).resolves.toEqual({
      following: false,
    });
    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe("getFollowingTeams", () => {
  it("returns teamIds defaulting to empty array when missing", async () => {
    const get = jest.fn().mockResolvedValue({ data: {} });
    const api = createGetMock(get);

    await expect(getFollowingTeams(api)).resolves.toEqual([]);
    expect(get).toHaveBeenCalledWith(GO_TEAM_SERVICE_ROUTES.TEAMS_ME_FOLLOWING);
  });

  it("returns teamIds from response", async () => {
    const get = jest.fn().mockResolvedValue({ data: { teamIds: ["a", "b"] } });
    const api = createGetMock(get);

    await expect(getFollowingTeams(api)).resolves.toEqual(["a", "b"]);
  });
});

describe("getFollowingLeagues", () => {
  it("returns leagueIds defaulting to empty array when missing", async () => {
    const get = jest.fn().mockResolvedValue({ data: {} });
    const api = createGetMock(get);

    await expect(getFollowingLeagues(api)).resolves.toEqual([]);
    expect(get).toHaveBeenCalledWith(
      GO_LEAGUE_SERVICE_ROUTES.LEAGUES_ME_FOLLOWING,
    );
  });

  it("returns leagueIds from response", async () => {
    const get = jest.fn().mockResolvedValue({ data: { leagueIds: ["x"] } });
    const api = createGetMock(get);

    await expect(getFollowingLeagues(api)).resolves.toEqual(["x"]);
  });
});

describe("invalidateFollowQueries", () => {
  it("invalidates status key and teams me key for team space", () => {
    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    invalidateFollowQueries(queryClient, "team", "tid");

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: followKey("team", "tid"),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: followingTeamsKey,
    });

    invalidateSpy.mockRestore();
  });

  it("invalidates status key and leagues me key for league space", () => {
    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    invalidateFollowQueries(queryClient, "league", "lid");

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: followKey("league", "lid"),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: followingLeaguesKey,
    });

    invalidateSpy.mockRestore();
  });
});
