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
