import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { beforeEach, describe, expect, it } from "@jest/globals";
import type { AxiosInstance } from "axios";
import type { MockedFunction } from "jest-mock";
import { useFollowingFeed } from "@/hooks/use-following-feed";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { toast } from "@/utils/toast";
import {
  fetchUserNameMap,
  mapToFrontendPost,
} from "@/utils/board";
import { followingFeedQueryKey } from "@/constants/follow";
import * as homeModule from "@/utils/home";

declare const jest: typeof import("@jest/globals").jest;

const mockedUseQuery = useQuery as MockedFunction<typeof useQuery>;
const mockedUseAuth = useAuth as MockedFunction<typeof useAuth>;
const mockedUseAxiosWithClerk = useAxiosWithClerk as MockedFunction<
  typeof useAxiosWithClerk
>;
const mockedFetchUserNameMap = fetchUserNameMap as MockedFunction<
  typeof fetchUserNameMap
>;
const mockedMapToFrontendPost = mapToFrontendPost as MockedFunction<
  typeof mapToFrontendPost
>;
const mockedToastError = toast.error as MockedFunction<typeof toast.error>;

type MockGet = MockedFunction<
  (
    url: string,
    config?: { params?: Record<string, string | number | boolean> },
  ) => Promise<{ data: unknown }>
>;

const mockGet = jest.fn() as MockGet;

jest.mock("@tanstack/react-query", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useQuery: require("@jest/globals").jest.fn(),
}));

jest.mock("@clerk/clerk-expo", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useAuth: require("@jest/globals").jest.fn(),
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useAxiosWithClerk: require("@jest/globals").jest.fn(),
  GO_TEAM_SERVICE_ROUTES: {
    ALL: "/api/v1/teams",
    TEAMS_ME_FOLLOWING: "/api/v1/teams/me/following",
    TEAM_POSTS: (teamId: string) => `/api/v1/teams/${teamId}/posts`,
    MATCHES: (teamId: string) => `/api/v1/teams/${teamId}/matches`,
  },
  GO_LEAGUE_SERVICE_ROUTES: {
    LEAGUES_ME_FOLLOWING: "/api/v1/leagues/me/following",
    GET: (leagueId: string) => `/api/v1/leagues/${leagueId}`,
    LEAGUE_POSTS: (leagueId: string) => `/api/v1/leagues/${leagueId}/posts`,
    MATCHES: (leagueId: string) => `/api/v1/leagues/${leagueId}/matches`,
  },
}));

jest.mock("@/utils/board", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  fetchUserNameMap: require("@jest/globals").jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mapToFrontendPost: require("@jest/globals").jest.fn(),
}));

jest.mock("@/utils/toast", () => ({
  toast: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    error: require("@jest/globals").jest.fn(),
  },
}));

describe("useFollowingFeed", () => {
  const mockApi = {
    get: mockGet,
  } as unknown as AxiosInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAxiosWithClerk.mockReturnValue(mockApi);
    mockedUseAuth.mockReturnValue({ userId: "user-1" } as never);
    mockedUseQuery.mockImplementation((options: unknown) => options as never);
    mockedFetchUserNameMap.mockResolvedValue({});
    mockedMapToFrontendPost.mockImplementation(
      (post: {
        id: string;
        title: string;
        body: string;
        scope: "Members" | "Everyone";
        createdAt: string;
      }) => ({
        id: post.id,
        title: post.title,
        body: post.body,
        scope: post.scope,
        createdAt: post.createdAt,
        authorName: "Author",
      }),
    );
    mockedToastError.mockClear();

    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: [] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: [] } };
      }
      throw new Error(`Unexpected GET ${url}`);
    });
  });

  it("configures query with user-scoped key and enabled flag", () => {
    mockedUseAuth.mockReturnValue({ userId: null } as never);

    const options = useFollowingFeed() as unknown as {
      queryKey: unknown[];
      enabled: boolean;
    };

    expect(options.queryKey).toEqual(followingFeedQueryKey(null));
    expect(options.enabled).toBe(false);
  });

  it("returns empty items and followedAny false when user follows nothing", async () => {
    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{ items: unknown[]; followedAny: boolean }>;
    };

    await expect(options.queryFn()).resolves.toEqual({
      items: [],
      followedAny: false,
    });
    expect(mockGet).toHaveBeenCalledWith("/api/v1/teams/me/following");
    expect(mockGet).toHaveBeenCalledWith("/api/v1/leagues/me/following");
  });

  it("includes only Everyone posts and keeps upcoming matches", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: ["team-1"] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: [] } };
      }
      if (url === "/api/v1/teams/team-1") {
        return {
          data: {
            id: "team-1",
            name: "Raptors",
            sport: "basketball",
            logoUrl: null,
            archived: false,
            createdAt: "2026-04-01T00:00:00.000Z",
            updatedAt: "2026-04-01T00:00:00.000Z",
          },
        };
      }
      if (url === "/api/v1/teams/team-1/posts") {
        return {
          data: {
            posts: [
              {
                id: "post-members",
                teamId: "team-1",
                authorUserId: "user-a",
                authorRole: "MANAGER",
                title: "Members only",
                body: "Secret",
                scope: "Members",
                createdAt: "2026-04-02T10:00:00.000Z",
              },
              {
                id: "post-everyone",
                teamId: "team-1",
                authorUserId: "user-a",
                authorRole: "MANAGER",
                title: "Public",
                body: "Hello",
                scope: "Everyone",
                createdAt: "2026-04-02T11:00:00.000Z",
              },
            ],
          },
        };
      }
      if (url === "/api/v1/teams/team-1/matches") {
        return {
          data: [
            {
              id: "match-team-1",
              matchType: "TEAM_MATCH",
              status: "CONFIRMED",
              homeTeamId: "team-1",
              awayTeamId: "team-2",
              sport: "basketball",
              startTime: "2099-05-02T10:00:00.000Z",
              endTime: "2099-05-02T11:00:00.000Z",
              requiresReferee: false,
              createdByUserId: "user-a",
              createdAt: "2026-04-01T10:00:00.000Z",
              updatedAt: "2026-04-01T10:00:00.000Z",
            },
          ],
        };
      }
      if (url === "/api/v1/teams/team-2") {
        return {
          data: {
            id: "team-2",
            name: "Wolves",
            sport: "basketball",
            logoUrl: null,
            archived: false,
            createdAt: "2026-04-01T00:00:00.000Z",
            updatedAt: "2026-04-01T00:00:00.000Z",
          },
        };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    mockedFetchUserNameMap.mockResolvedValue({ "user-a": "Coach A" });

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{
        items: { kind: string; id: string }[];
        followedAny: boolean;
      }>;
    };

    const result = await options.queryFn();

    expect(result.followedAny).toBe(true);
    expect(
      result.items.some((item) => item.kind === "post" && item.id === "post-members"),
    ).toBe(false);
    expect(
      result.items.some((item) => item.kind === "post" && item.id === "post-everyone"),
    ).toBe(true);
    expect(
      result.items.some((item) => item.kind === "match" && item.id === "match-team-1"),
    ).toBe(true);
    expect(mockGet).toHaveBeenCalledWith(
      "/api/v1/teams/team-1/posts",
      expect.objectContaining({ params: { page: 0, size: 50 } }),
    );
  });

  it("disables refetch-on-mount, refetch-on-window-focus, and retry", () => {
    const options = useFollowingFeed() as unknown as {
      refetchOnMount: boolean;
      refetchOnWindowFocus: boolean;
      retry: boolean | number;
    };

    expect(options.refetchOnMount).toBe(false);
    expect(options.refetchOnWindowFocus).toBe(false);
    expect(options.retry).toBe(false);
  });

  it("requests league posts with pagination params", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: [] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: ["league-x"] } };
      }
      if (url === "/api/v1/leagues/league-x") {
        return {
          data: {
            id: "league-x",
            name: "Metro",
            sport: "hockey",
            slug: "metro",
            logoUrl: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        };
      }
      if (url === "/api/v1/leagues/league-x/posts") {
        return {
          data: {
            items: [
              {
                id: "lp-1",
                leagueId: "league-x",
                authorUserId: "u9",
                title: "News",
                body: "Hi",
                scope: "Everyone",
                createdAt: "2026-04-10T10:00:00.000Z",
              },
            ],
          },
        };
      }
      if (url === "/api/v1/leagues/league-x/matches") {
        return { data: [] };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    mockedFetchUserNameMap.mockResolvedValue({ u9: "Pat" });

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{ items: { kind: string; id: string }[]; followedAny: boolean }>;
    };

    const result = await options.queryFn();

    expect(result.followedAny).toBe(true);
    expect(result.items.some((item) => item.kind === "post" && item.id === "lp-1")).toBe(
      true,
    );
    expect(mockGet).toHaveBeenCalledWith(
      "/api/v1/leagues/league-x/posts",
      expect.objectContaining({ params: { page: 0, size: 50 } }),
    );
  });

  it("aggregates league matches when only leagues are followed", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: [] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: ["league-x"] } };
      }
      if (url === "/api/v1/leagues/league-x") {
        return {
          data: {
            id: "league-x",
            name: "Metro",
            sport: "hockey",
            slug: "metro",
            logoUrl: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        };
      }
      if (url === "/api/v1/leagues/league-x/posts") {
        return { data: { items: [] } };
      }
      if (url === "/api/v1/leagues/league-x/matches") {
        return {
          data: [
            {
              id: "lm-1",
              leagueId: "league-x",
              status: "CONFIRMED",
              homeTeamId: "home-t",
              awayTeamId: "away-t",
              sport: "hockey",
              startTime: "2099-06-15T18:00:00.000Z",
              endTime: "2099-06-15T19:00:00.000Z",
              requiresReferee: false,
              createdByUserId: "u1",
              createdAt: "2026-04-01T08:00:00.000Z",
              updatedAt: "2026-04-01T08:00:00.000Z",
            },
          ],
        };
      }
      if (url === "/api/v1/teams/home-t") {
        return {
          data: {
            id: "home-t",
            name: "Home FC",
            sport: "hockey",
            archived: false,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        };
      }
      if (url === "/api/v1/teams/away-t") {
        return {
          data: {
            id: "away-t",
            name: "Away FC",
            sport: "hockey",
            archived: false,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    mockedFetchUserNameMap.mockResolvedValue({});

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{
        items: { kind: string; id: string; contextLabel?: string }[];
        followedAny: boolean;
      }>;
    };

    const result = await options.queryFn();

    expect(result.followedAny).toBe(true);
    const leagueMatch = result.items.find(
      (item) => item.kind === "match" && item.id === "lm-1",
    );
    expect(leagueMatch).toEqual(
      expect.objectContaining({
        kind: "match",
        id: "lm-1",
        contextLabel: "Metro",
      }),
    );
  });

  it("filters Members-only posts from league lists", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: [] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: ["league-z"] } };
      }
      if (url === "/api/v1/leagues/league-z") {
        return {
          data: {
            id: "league-z",
            name: "Zed",
            sport: "soccer",
            slug: "zed",
            logoUrl: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        };
      }
      if (url === "/api/v1/leagues/league-z/posts") {
        return {
          data: {
            items: [
              {
                id: "m1",
                leagueId: "league-z",
                authorUserId: "u1",
                title: "Secret",
                body: "Members",
                scope: "Members",
                createdAt: "2026-04-01T10:00:00.000Z",
              },
            ],
          },
        };
      }
      if (url === "/api/v1/leagues/league-z/matches") {
        return { data: [] };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    mockedFetchUserNameMap.mockResolvedValue({});

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{ items: { kind: string; id: string }[]; followedAny: boolean }>;
    };

    const result = await options.queryFn();

    expect(result.followedAny).toBe(true);
    expect(result.items.filter((i) => i.kind === "post")).toHaveLength(0);
  });

  it("drops past matches from the feed", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: ["team-1"] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: [] } };
      }
      if (url === "/api/v1/teams/team-1") {
        return {
          data: {
            id: "team-1",
            name: "Raptors",
            sport: "basketball",
            logoUrl: null,
            archived: false,
            createdAt: "2026-04-01T00:00:00.000Z",
            updatedAt: "2026-04-01T00:00:00.000Z",
          },
        };
      }
      if (url === "/api/v1/teams/team-1/posts") {
        return { data: { posts: [] } };
      }
      if (url === "/api/v1/teams/team-1/matches") {
        return {
          data: [
            {
              id: "match-future",
              matchType: "TEAM_MATCH",
              status: "CONFIRMED",
              homeTeamId: "team-1",
              awayTeamId: "team-2",
              sport: "basketball",
              startTime: "2099-07-01T10:00:00.000Z",
              endTime: "2099-07-01T11:00:00.000Z",
              requiresReferee: false,
              createdByUserId: "user-a",
              createdAt: "2026-04-01T10:00:00.000Z",
              updatedAt: "2026-04-01T10:00:00.000Z",
            },
            {
              id: "match-past",
              matchType: "TEAM_MATCH",
              status: "CONFIRMED",
              homeTeamId: "team-1",
              awayTeamId: "team-2",
              sport: "basketball",
              startTime: "2000-01-01T10:00:00.000Z",
              endTime: "2000-01-01T11:00:00.000Z",
              requiresReferee: false,
              createdByUserId: "user-a",
              createdAt: "2026-04-01T10:00:00.000Z",
              updatedAt: "2026-04-01T10:00:00.000Z",
            },
          ],
        };
      }
      if (url === "/api/v1/teams/team-2") {
        return {
          data: {
            id: "team-2",
            name: "Wolves",
            sport: "basketball",
            logoUrl: null,
            archived: false,
            createdAt: "2026-04-01T00:00:00.000Z",
            updatedAt: "2026-04-01T00:00:00.000Z",
          },
        };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    mockedFetchUserNameMap.mockResolvedValue({});

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{ items: { kind: string; id: string }[]; followedAny: boolean }>;
    };

    const result = await options.queryFn();

    expect(
      result.items.some((item) => item.kind === "match" && item.id === "match-future"),
    ).toBe(true);
    expect(
      result.items.some((item) => item.kind === "match" && item.id === "match-past"),
    ).toBe(false);
  });

  it("keeps matches when team posts request fails", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: ["team-1"] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: [] } };
      }
      if (url === "/api/v1/teams/team-1") {
        return {
          data: {
            id: "team-1",
            name: "Raptors",
            sport: "basketball",
            logoUrl: null,
            archived: false,
            createdAt: "2026-04-01T00:00:00.000Z",
            updatedAt: "2026-04-01T00:00:00.000Z",
          },
        };
      }
      if (url === "/api/v1/teams/team-1/posts") {
        throw new Error("posts unavailable");
      }
      if (url === "/api/v1/teams/team-1/matches") {
        return {
          data: [
            {
              id: "match-only",
              matchType: "TEAM_MATCH",
              status: "CONFIRMED",
              homeTeamId: "team-1",
              awayTeamId: "team-2",
              sport: "basketball",
              startTime: "2099-08-01T10:00:00.000Z",
              endTime: "2099-08-01T11:00:00.000Z",
              requiresReferee: false,
              createdByUserId: "user-a",
              createdAt: "2026-04-01T10:00:00.000Z",
              updatedAt: "2026-04-01T10:00:00.000Z",
            },
          ],
        };
      }
      if (url === "/api/v1/teams/team-2") {
        return {
          data: {
            id: "team-2",
            name: "Wolves",
            sport: "basketball",
            logoUrl: null,
            archived: false,
            createdAt: "2026-04-01T00:00:00.000Z",
            updatedAt: "2026-04-01T00:00:00.000Z",
          },
        };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    mockedFetchUserNameMap.mockResolvedValue({});

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{ items: { kind: string; id: string }[]; followedAny: boolean }>;
    };

    const result = await options.queryFn();

    expect(result.items.every((item) => item.kind === "match")).toBe(true);
    expect(result.items.some((item) => item.id === "match-only")).toBe(true);
  });

  it("uses fallback team space when fetchTeamSummaryMap returns no entry", async () => {
    const realFetch = jest.requireActual<typeof import("@/utils/home")>(
      "@/utils/home",
    ).fetchTeamSummaryMap;
    const spy = jest
      .spyOn(homeModule, "fetchTeamSummaryMap")
      .mockImplementation(async (api, teams, teamIds, log) => {
        if (teams.length === 0 && teamIds.length === 1 && teamIds[0] === "solo") {
          return {};
        }
        return realFetch(api, teams, teamIds, log);
      });

    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: ["solo"] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: [] } };
      }
      if (url === "/api/v1/teams/solo/posts") {
        return { data: { posts: [] } };
      }
      if (url === "/api/v1/teams/solo/matches") {
        return { data: [] };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    mockedFetchUserNameMap.mockResolvedValue({});

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{ items: unknown[]; followedAny: boolean }>;
    };

    try {
      await expect(options.queryFn()).resolves.toEqual({
        items: [],
        followedAny: true,
      });
    } finally {
      spy.mockRestore();
    }
  });

  it("uses placeholder team when summary GET fails but feed still resolves", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: ["ghost-team"] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: [] } };
      }
      if (url === "/api/v1/teams/ghost-team") {
        throw new Error("not found");
      }
      if (url === "/api/v1/teams/ghost-team/posts") {
        return { data: { posts: [] } };
      }
      if (url === "/api/v1/teams/ghost-team/matches") {
        return { data: [] };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    mockedFetchUserNameMap.mockResolvedValue({});

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{ items: unknown[]; followedAny: boolean }>;
    };

    await expect(options.queryFn()).resolves.toEqual({
      items: [],
      followedAny: true,
    });
  });

  it("combines team and league feed items when both are followed", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: ["team-a"] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: ["league-b"] } };
      }
      if (url === "/api/v1/teams/team-a") {
        return {
          data: {
            id: "team-a",
            name: "Alpha",
            sport: "soccer",
            logoUrl: null,
            archived: false,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        };
      }
      if (url === "/api/v1/teams/team-a/posts") {
        return {
          data: {
            posts: [
              {
                id: "tp-1",
                teamId: "team-a",
                authorUserId: "u1",
                authorRole: "MANAGER",
                title: "Team note",
                body: "Hi",
                scope: "Everyone",
                createdAt: "2026-04-11T10:00:00.000Z",
              },
            ],
          },
        };
      }
      if (url === "/api/v1/teams/team-a/matches") {
        return { data: [] };
      }
      if (url === "/api/v1/leagues/league-b") {
        return {
          data: {
            id: "league-b",
            name: "Beta League",
            sport: "soccer",
            slug: "beta",
            logoUrl: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        };
      }
      if (url === "/api/v1/leagues/league-b/posts") {
        return {
          data: {
            items: [
              {
                id: "lp-1",
                leagueId: "league-b",
                authorUserId: "u2",
                title: "League note",
                body: "Hello",
                scope: "Everyone",
                createdAt: "2026-04-11T11:00:00.000Z",
              },
            ],
          },
        };
      }
      if (url === "/api/v1/leagues/league-b/matches") {
        return { data: [] };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    mockedFetchUserNameMap.mockResolvedValue({ u1: "A", u2: "B" });

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{ items: { kind: string; id: string }[]; followedAny: boolean }>;
    };

    const result = await options.queryFn();

    expect(result.followedAny).toBe(true);
    expect(result.items.some((i) => i.kind === "post" && i.id === "tp-1")).toBe(true);
    expect(result.items.some((i) => i.kind === "post" && i.id === "lp-1")).toBe(true);
  });

  it("omits team matches when the team matches request fails", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: ["team-1"] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: [] } };
      }
      if (url === "/api/v1/teams/team-1") {
        return {
          data: {
            id: "team-1",
            name: "Raptors",
            sport: "basketball",
            logoUrl: null,
            archived: false,
            createdAt: "2026-04-01T00:00:00.000Z",
            updatedAt: "2026-04-01T00:00:00.000Z",
          },
        };
      }
      if (url === "/api/v1/teams/team-1/posts") {
        return {
          data: {
            posts: [
              {
                id: "p-only",
                teamId: "team-1",
                authorUserId: "u1",
                authorRole: "MANAGER",
                title: "News",
                body: "Hi",
                scope: "Everyone",
                createdAt: "2026-04-12T10:00:00.000Z",
              },
            ],
          },
        };
      }
      if (url === "/api/v1/teams/team-1/matches") {
        throw new Error("matches unavailable");
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    mockedFetchUserNameMap.mockResolvedValue({ u1: "Coach" });

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{ items: { kind: string }[]; followedAny: boolean }>;
    };

    const result = await options.queryFn();

    expect(result.followedAny).toBe(true);
    expect(result.items.every((i) => i.kind === "post")).toBe(true);
  });

  it("omits league posts when the league posts request fails", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: [] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: ["league-d"] } };
      }
      if (url === "/api/v1/leagues/league-d") {
        return {
          data: {
            id: "league-d",
            name: "Delta",
            sport: "soccer",
            slug: "d",
            logoUrl: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        };
      }
      if (url === "/api/v1/leagues/league-d/posts") {
        throw new Error("posts down");
      }
      if (url === "/api/v1/leagues/league-d/matches") {
        return { data: [] };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    mockedFetchUserNameMap.mockResolvedValue({});

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{ items: { kind: string }[]; followedAny: boolean }>;
    };

    const result = await options.queryFn();

    expect(result.followedAny).toBe(true);
    expect(result.items).toHaveLength(0);
  });

  it("omits league matches when the league matches request fails", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        return { data: { teamIds: [] } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: ["league-c"] } };
      }
      if (url === "/api/v1/leagues/league-c") {
        return {
          data: {
            id: "league-c",
            name: "Charlie",
            sport: "soccer",
            slug: "c",
            logoUrl: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        };
      }
      if (url === "/api/v1/leagues/league-c/posts") {
        return { data: { items: [] } };
      }
      if (url === "/api/v1/leagues/league-c/matches") {
        throw new Error("matches down");
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    mockedFetchUserNameMap.mockResolvedValue({});

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<{ items: { kind: string }[]; followedAny: boolean }>;
    };

    const result = await options.queryFn();

    expect(result.followedAny).toBe(true);
    expect(result.items.every((i) => i.kind !== "match")).toBe(true);
  });

  it("shows error toast with API message when follow list rejects with response", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/api/v1/teams/me/following") {
        throw { response: { status: 403, data: { message: "Forbidden" } } };
      }
      if (url === "/api/v1/leagues/me/following") {
        return { data: { leagueIds: [] } };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await expect(options.queryFn()).rejects.toEqual(
      expect.objectContaining({ response: expect.any(Object) }),
    );

    expect(mockedToastError).toHaveBeenCalledWith("Failed to Load Following", {
      description: "Request failed: Forbidden",
    });
  });

  it("shows error toast when following feed resolution fails", async () => {
    mockGet.mockImplementation(async () => {
      throw new Error("network");
    });

    const options = useFollowingFeed() as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await expect(options.queryFn()).rejects.toThrow("network");

    expect(mockedToastError).toHaveBeenCalledWith("Failed to Load Following", {
      description: "network",
    });
  });
});
