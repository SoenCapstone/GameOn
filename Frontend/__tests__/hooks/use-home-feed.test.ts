import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { beforeEach, describe, expect, it } from "@jest/globals";
import type { AxiosInstance } from "axios";
import type { MockedFunction } from "jest-mock";
import { useHomeFeed } from "@/hooks/use-home-feed";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { fetchMyTeams } from "@/hooks/messages/api";
import { toast } from "@/utils/toast";
import { fetchUserNameMap, mapToFrontendPost } from "@/utils/board";
import type { HomeFeedItem } from "@/types/feed";

declare const jest: typeof import("@jest/globals").jest;

const mockedUseQuery = useQuery as MockedFunction<typeof useQuery>;
const mockedUseAuth = useAuth as MockedFunction<typeof useAuth>;
const mockedUseAxiosWithClerk = useAxiosWithClerk as MockedFunction<
  typeof useAxiosWithClerk
>;
const mockedFetchMyTeams = fetchMyTeams as MockedFunction<typeof fetchMyTeams>;
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

jest.mock("@/hooks/messages/api", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  fetchMyTeams: require("@jest/globals").jest.fn(),
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useAxiosWithClerk: require("@jest/globals").jest.fn(),
  GO_TEAM_SERVICE_ROUTES: {
    ALL: "/api/v1/teams",
    TEAM_POSTS: (teamId: string) => `/api/v1/teams/${teamId}/posts`,
    MATCHES: (teamId: string) => `/api/v1/teams/${teamId}/matches`,
  },
  GO_LEAGUE_SERVICE_ROUTES: {
    ALL: "/api/v1/leagues",
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

/** Home feed query; shared post/match assembly is covered in `__tests__/utils/home.test.ts`. */
describe("useHomeFeed", () => {
  const mockApi = {
    get: mockGet,
  } as unknown as AxiosInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAxiosWithClerk.mockReturnValue(mockApi);
    mockedUseAuth.mockReturnValue({ userId: "user-1" } as never);
    mockedUseQuery.mockImplementation((options: unknown) => options as never);
    mockedFetchMyTeams.mockResolvedValue([]);
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
  });

  it("configures query with user-scoped key and enabled flag", () => {
    mockedUseAuth.mockReturnValue({ userId: null } as never);

    const options = useHomeFeed() as unknown as {
      queryKey: unknown[];
      enabled: boolean;
    };

    expect(options.queryKey).toEqual(["home-feed", null]);
    expect(options.enabled).toBe(false);
  });

  it("returns empty feed when user has no teams and no leagues", async () => {
    mockGet.mockResolvedValueOnce({ data: { items: [] } });

    const options = useHomeFeed() as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await expect(options.queryFn()).resolves.toEqual([]);
  });

  it("aggregates team and league feed items with team/league context labels", async () => {
    mockedFetchMyTeams.mockResolvedValue([
      {
        id: "team-1",
        name: "Raptors",
        sport: "basketball",
        logoUrl: null,
        leagueId: "league-1",
        archived: false,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    ]);

    mockGet.mockImplementation(
      async (
        url: string,
        config?: { params?: Record<string, string | number | boolean> },
      ) => {
        if (url === "/api/v1/leagues" && config?.params?.my === true) {
          return { data: { items: [{ id: "league-2" }] } };
        }
        if (url === "/api/v1/teams/team-1/posts") {
          return {
            data: {
              posts: [
                {
                  id: "post-1",
                  teamId: "team-1",
                  authorUserId: "user-a",
                  authorRole: "MANAGER",
                  title: "Team post",
                  body: "Body",
                  scope: "Members",
                  createdAt: "2026-04-02T10:00:00.000Z",
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
        if (url === "/api/v1/leagues/league-1/posts") {
          return {
            data: {
              items: [
                {
                  id: "post-2",
                  leagueId: "league-1",
                  authorUserId: "user-b",
                  title: "League post",
                  body: "Body",
                  scope: "Everyone",
                  createdAt: "2026-04-03T10:00:00.000Z",
                },
              ],
            },
          };
        }
        if (url === "/api/v1/leagues/league-2/posts") {
          return { data: { items: [] } };
        }
        if (url === "/api/v1/leagues/league-1/matches") {
          return {
            data: [
              {
                id: "match-league-1",
                leagueId: "league-1",
                status: "CONFIRMED",
                homeTeamId: "team-2",
                awayTeamId: "team-1",
                sport: "basketball",
                startTime: "2099-05-03T10:00:00.000Z",
                endTime: "2099-05-03T11:00:00.000Z",
                requiresReferee: false,
                createdByUserId: "user-a",
                createdAt: "2026-04-01T09:00:00.000Z",
                updatedAt: "2026-04-01T09:00:00.000Z",
              },
            ],
          };
        }
        if (url === "/api/v1/leagues/league-2/matches") {
          return { data: [] };
        }
        if (url === "/api/v1/leagues/league-1") {
          return {
            data: {
              id: "league-1",
              name: "Spring League",
              logoUrl: null,
              sport: "basketball",
            },
          };
        }
        if (url === "/api/v1/leagues/league-2") {
          return {
            data: {
              id: "league-2",
              name: "Summer League",
              logoUrl: null,
              sport: "basketball",
            },
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
      },
    );

    mockedFetchUserNameMap.mockResolvedValue({
      "user-a": "Coach A",
      "user-b": "Coach B",
    });

    const options = useHomeFeed() as unknown as {
      queryFn: () => Promise<HomeFeedItem[]>;
    };

    const result = await options.queryFn();

    const teamMatch = result.find(
      (item) => item.kind === "match" && item.id === "match-team-1",
    );
    const leagueMatch = result.find(
      (item) => item.kind === "match" && item.id === "match-league-1",
    );

    expect(teamMatch).toEqual(
      expect.objectContaining({
        kind: "match",
        contextLabel: "Team Match",
      }),
    );
    expect(leagueMatch).toEqual(
      expect.objectContaining({
        kind: "match",
        contextLabel: "Spring League",
      }),
    );
    expect(
      result.some((item) => item.kind === "post" && item.id === "post-1"),
    ).toBe(true);
    expect(
      result.some((item) => item.kind === "post" && item.id === "post-2"),
    ).toBe(true);
  });

  it("falls back when team and league summary lookups fail", async () => {
    mockedFetchMyTeams.mockResolvedValue([
      {
        id: "team-1",
        name: "Raptors",
        sport: "basketball",
        logoUrl: null,
        leagueId: "league-1",
        archived: false,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    ]);

    mockGet.mockImplementation(
      async (
        url: string,
        config?: { params?: Record<string, string | number | boolean> },
      ) => {
        if (url === "/api/v1/leagues" && config?.params?.my === true) {
          return { data: { items: [] } };
        }
        if (url === "/api/v1/teams/team-1/posts") {
          return {
            data: {
              posts: [
                {
                  id: "post-1",
                  teamId: "team-1",
                  authorUserId: "user-a",
                  authorRole: "MANAGER",
                  title: "Team post",
                  body: "Body",
                  scope: "Members",
                  createdAt: "2026-04-02T10:00:00.000Z",
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
        if (url === "/api/v1/leagues/league-1/posts") {
          return {
            data: {
              items: [
                {
                  id: "post-2",
                  leagueId: "league-1",
                  authorUserId: "user-b",
                  title: "League post",
                  body: "Body",
                  scope: "Everyone",
                  createdAt: "2026-04-03T10:00:00.000Z",
                },
              ],
            },
          };
        }
        if (url === "/api/v1/leagues/league-1/matches") {
          return {
            data: [
              {
                id: "match-league-1",
                leagueId: "league-1",
                status: "CONFIRMED",
                homeTeamId: "team-2",
                awayTeamId: "team-1",
                sport: "basketball",
                startTime: "2099-05-03T10:00:00.000Z",
                endTime: "2099-05-03T11:00:00.000Z",
                requiresReferee: false,
                createdByUserId: "user-a",
                createdAt: "2026-04-01T09:00:00.000Z",
                updatedAt: "2026-04-01T09:00:00.000Z",
              },
            ],
          };
        }
        if (url === "/api/v1/leagues/league-1") {
          throw new Error("league summary failed");
        }
        if (url === "/api/v1/teams/team-2") {
          throw new Error("team summary failed");
        }
        throw new Error(`Unexpected GET ${url}`);
      },
    );

    mockedFetchUserNameMap.mockResolvedValue({
      "user-a": "Coach A",
      "user-b": "Coach B",
    });

    const options = useHomeFeed() as unknown as {
      queryFn: () => Promise<HomeFeedItem[]>;
    };

    const result = await options.queryFn();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "post", id: "post-1" }),
        expect.objectContaining({ kind: "post", id: "post-2" }),
        expect.objectContaining({ kind: "match", id: "match-team-1" }),
        expect.objectContaining({ kind: "match", id: "match-league-1" }),
      ]),
    );
  });

  it("logs when feed bucket requests are rejected", async () => {
    mockedFetchMyTeams.mockResolvedValue([
      {
        id: "team-1",
        name: "Raptors",
        sport: "basketball",
        logoUrl: null,
        leagueId: "league-1",
        archived: false,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    ]);

    mockGet.mockImplementation(
      async (
        url: string,
        config?: { params?: Record<string, string | number | boolean> },
      ) => {
        if (url === "/api/v1/leagues" && config?.params?.my === true) {
          return { data: { items: [] } };
        }
        if (url === "/api/v1/leagues/league-1") {
          return {
            data: {
              id: "league-1",
              name: "Spring League",
              logoUrl: null,
              sport: "basketball",
            },
          };
        }
        if (url === "/api/v1/teams/team-1/posts") {
          throw new Error("team posts failed");
        }
        if (url === "/api/v1/teams/team-1/matches") {
          throw new Error("team matches failed");
        }
        if (url === "/api/v1/leagues/league-1/posts") {
          throw new Error("league posts failed");
        }
        if (url === "/api/v1/leagues/league-1/matches") {
          throw new Error("league matches failed");
        }
        throw new Error(`Unexpected GET ${url}`);
      },
    );

    mockedFetchUserNameMap.mockResolvedValue({});

    const options = useHomeFeed() as unknown as {
      queryFn: () => Promise<HomeFeedItem[]>;
    };

    await expect(options.queryFn()).resolves.toEqual([]);
  });

  it("handles nullish feed payloads without dropping the query", async () => {
    mockedFetchMyTeams.mockResolvedValue([
      {
        id: "team-1",
        name: "Raptors",
        sport: "basketball",
        logoUrl: null,
        leagueId: "league-1",
        archived: false,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    ]);

    mockGet.mockImplementation(
      async (
        url: string,
        config?: { params?: Record<string, string | number | boolean> },
      ) => {
        if (url === "/api/v1/leagues" && config?.params?.my === true) {
          return { data: { items: [] } };
        }
        if (url === "/api/v1/teams/team-1/posts") {
          return { data: { posts: null } };
        }
        if (url === "/api/v1/teams/team-1/matches") {
          return { data: null };
        }
        if (url === "/api/v1/leagues/league-1/posts") {
          return { data: { items: null } };
        }
        if (url === "/api/v1/leagues/league-1/matches") {
          return { data: null };
        }
        if (url === "/api/v1/leagues/league-1") {
          return {
            data: {
              id: "league-1",
              name: "Spring League",
              logoUrl: null,
              sport: "basketball",
            },
          };
        }
        throw new Error(`Unexpected GET ${url}`);
      },
    );

    mockedFetchUserNameMap.mockResolvedValue({});

    const options = useHomeFeed() as unknown as {
      queryFn: () => Promise<HomeFeedItem[]>;
    };

    await expect(options.queryFn()).resolves.toEqual([]);
  });

  it("marks scored matches as completed", async () => {
    mockedFetchMyTeams.mockResolvedValue([
      {
        id: "team-1",
        name: "Raptors",
        sport: "basketball",
        logoUrl: null,
        leagueId: null,
        archived: false,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    ]);

    mockGet.mockImplementation(
      async (
        url: string,
        config?: { params?: Record<string, string | number | boolean> },
      ) => {
        if (url === "/api/v1/leagues" && config?.params?.my === true) {
          return { data: { items: [] } };
        }
        if (url === "/api/v1/teams/team-1/posts") {
          return { data: { posts: [] } };
        }
        if (url === "/api/v1/teams/team-1/matches") {
          return {
            data: [
              {
                id: "match-1",
                matchType: "TEAM_MATCH",
                status: "CONFIRMED",
                homeTeamId: "team-1",
                awayTeamId: "team-2",
                sport: "basketball",
                startTime: "2099-05-03T10:00:00.000Z",
                endTime: "2099-05-03T11:00:00.000Z",
                requiresReferee: false,
                createdByUserId: "user-a",
                createdAt: "2026-04-01T09:00:00.000Z",
                updatedAt: "2026-04-01T09:00:00.000Z",
                homeScore: 88,
                awayScore: 81,
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
      },
    );

    mockedFetchUserNameMap.mockResolvedValue({});

    const options = useHomeFeed() as unknown as {
      queryFn: () => Promise<HomeFeedItem[]>;
    };

    const result = await options.queryFn();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "match",
          id: "match-1",
          status: "COMPLETED",
          homeScore: 88,
          awayScore: 81,
        }),
      ]),
    );
  });

  it("logs and rethrows when feed query fails", async () => {
    mockedFetchMyTeams.mockRejectedValue(new Error("boom"));
    mockGet.mockResolvedValue({ data: { items: [] } });

    const options = useHomeFeed() as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await expect(options.queryFn()).rejects.toThrow("boom");
    expect(mockedToastError).toHaveBeenCalledWith("Failed to Load Feed", {
      description: "boom",
    });
  });

  it("continues when my league ids lookup fails", async () => {
    mockedFetchMyTeams.mockResolvedValue([
      {
        id: "team-1",
        name: "Raptors",
        sport: "basketball",
        logoUrl: null,
        leagueId: null,
        archived: false,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    ]);

    mockGet.mockImplementation(
      async (
        url: string,
        config?: { params?: Record<string, string | number | boolean> },
      ) => {
        if (url === "/api/v1/leagues" && config?.params?.my === true) {
          throw new Error("leagues failed");
        }
        if (url === "/api/v1/teams/team-1/posts") {
          return { data: { posts: [] } };
        }
        if (url === "/api/v1/teams/team-1/matches") {
          return { data: [] };
        }
        throw new Error(`Unexpected GET ${url}`);
      },
    );

    const options = useHomeFeed() as unknown as {
      queryFn: () => Promise<HomeFeedItem[]>;
    };

    await expect(options.queryFn()).resolves.toEqual([]);
  });
});
