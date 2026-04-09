import { useQuery } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import { useExploreMatches } from "@/hooks/use-explore-matches";
import { exploreMatchesQueryKey } from "@/utils/explore";
import {
  GO_EXPLORE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: jest.fn(),
  GO_EXPLORE_ROUTES: {
    LEAGUE_MATCHES: "api/v1/explore/league-matches",
    TEAM_MATCHES: "api/v1/explore/team-matches",
  },
}));

describe("useExploreMatches", () => {
  const mockApi = {
    post: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAxiosWithClerk as jest.Mock).mockReturnValue(mockApi);
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn().mockResolvedValue({}),
    });
  });

  it("disables query when coordinates or range are missing or invalid", () => {
    renderHook(() =>
      useExploreMatches({
        latitude: null,
        longitude: -79,
        rangeKm: 10,
      }),
    );
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryKey: ["explore-matches", "disabled"],
      }),
    );

    renderHook(() =>
      useExploreMatches({
        latitude: 43,
        longitude: -79,
        rangeKm: 0,
      }),
    );
    expect(useQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it("posts both explore endpoints with the same body and merges results", async () => {
    let capturedQueryFn: (() => Promise<unknown>) | undefined;
    (useQuery as jest.Mock).mockImplementation((options) => {
      capturedQueryFn = options.queryFn;
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn().mockResolvedValue({}),
      };
    });

    const leagueMatch = {
      id: "lm-1",
      leagueId: "leg-1",
      status: "CONFIRMED" as const,
      homeTeamId: "h1",
      awayTeamId: "a1",
      sport: "soccer",
      startTime: "2026-04-10T18:00:00Z",
      endTime: "2026-04-10T20:00:00Z",
      requiresReferee: false,
      createdByUserId: "u1",
      createdAt: "2026-04-01T00:00:00Z",
      updatedAt: "2026-04-01T00:00:00Z",
    };
    const teamMatch = {
      id: "tm-1",
      matchType: "TEAM_MATCH" as const,
      status: "CONFIRMED" as const,
      homeTeamId: "h2",
      awayTeamId: "a2",
      sport: "soccer",
      startTime: "2026-04-09T18:00:00Z",
      endTime: "2026-04-09T20:00:00Z",
      requiresReferee: false,
      createdByUserId: "u1",
      createdAt: "2026-04-01T00:00:00Z",
      updatedAt: "2026-04-01T00:00:00Z",
    };

    mockApi.post.mockImplementation((url: string) => {
      if (url === GO_EXPLORE_ROUTES.LEAGUE_MATCHES) {
        return Promise.resolve({ data: [leagueMatch] });
      }
      if (url === GO_EXPLORE_ROUTES.TEAM_MATCHES) {
        return Promise.resolve({ data: [teamMatch] });
      }
      return Promise.resolve({ data: [] });
    });

    renderHook(() =>
      useExploreMatches({
        latitude: 43,
        longitude: -79,
        rangeKm: 25,
        sport: " soccer ",
      }),
    );

    expect(useQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enabled: true,
        queryKey: exploreMatchesQueryKey(
          {
            latitude: 43,
            longitude: -79,
            rangeKm: 25,
            sport: "soccer",
          },
          "all",
        ),
        retry: false,
      }),
    );

    const merged = await capturedQueryFn!();
    expect(mockApi.post).toHaveBeenCalledWith(
      GO_EXPLORE_ROUTES.LEAGUE_MATCHES,
      {
        latitude: 43,
        longitude: -79,
        rangeKm: 25,
        sport: "soccer",
      },
    );
    expect(mockApi.post).toHaveBeenCalledWith(
      GO_EXPLORE_ROUTES.TEAM_MATCHES,
      {
        latitude: 43,
        longitude: -79,
        rangeKm: 25,
        sport: "soccer",
      },
    );

    expect(merged).toEqual([
      { kind: "team", match: teamMatch },
      { kind: "league", match: leagueMatch },
    ]);
  });

  it("with filter league only posts league explore endpoint", async () => {
    let capturedQueryFn: (() => Promise<unknown>) | undefined;
    (useQuery as jest.Mock).mockImplementation((options) => {
      capturedQueryFn = options.queryFn;
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn().mockResolvedValue({}),
      };
    });

    const leagueMatch = {
      id: "lm-1",
      leagueId: "leg-1",
      status: "CONFIRMED" as const,
      homeTeamId: "h1",
      awayTeamId: "a1",
      sport: "soccer",
      startTime: "2026-04-10T18:00:00Z",
      endTime: "2026-04-10T20:00:00Z",
      requiresReferee: false,
      createdByUserId: "u1",
      createdAt: "2026-04-01T00:00:00Z",
      updatedAt: "2026-04-01T00:00:00Z",
    };

    mockApi.post.mockResolvedValue({ data: [leagueMatch] });

    renderHook(() =>
      useExploreMatches({
        latitude: 43,
        longitude: -79,
        rangeKm: 10,
        filter: "league",
      }),
    );

    expect(useQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryKey: exploreMatchesQueryKey(
          { latitude: 43, longitude: -79, rangeKm: 10 },
          "league",
        ),
      }),
    );

    const merged = await capturedQueryFn!();
    expect(mockApi.post).toHaveBeenCalledTimes(1);
    expect(mockApi.post).toHaveBeenCalledWith(
      GO_EXPLORE_ROUTES.LEAGUE_MATCHES,
      { latitude: 43, longitude: -79, rangeKm: 10 },
    );
    expect(merged).toEqual([{ kind: "league", match: leagueMatch }]);
  });

  it("with filter team only posts team explore endpoint", async () => {
    let capturedQueryFn: (() => Promise<unknown>) | undefined;
    (useQuery as jest.Mock).mockImplementation((options) => {
      capturedQueryFn = options.queryFn;
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn().mockResolvedValue({}),
      };
    });

    const teamMatch = {
      id: "tm-1",
      matchType: "TEAM_MATCH" as const,
      status: "CONFIRMED" as const,
      homeTeamId: "h2",
      awayTeamId: "a2",
      sport: "soccer",
      startTime: "2026-04-09T18:00:00Z",
      endTime: "2026-04-09T20:00:00Z",
      requiresReferee: false,
      createdByUserId: "u1",
      createdAt: "2026-04-01T00:00:00Z",
      updatedAt: "2026-04-01T00:00:00Z",
    };

    mockApi.post.mockResolvedValue({ data: [teamMatch] });

    renderHook(() =>
      useExploreMatches({
        latitude: 43,
        longitude: -79,
        rangeKm: 10,
        filter: "team",
      }),
    );

    expect(useQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryKey: exploreMatchesQueryKey(
          { latitude: 43, longitude: -79, rangeKm: 10 },
          "team",
        ),
      }),
    );

    const merged = await capturedQueryFn!();
    expect(mockApi.post).toHaveBeenCalledTimes(1);
    expect(mockApi.post).toHaveBeenCalledWith(
      GO_EXPLORE_ROUTES.TEAM_MATCHES,
      { latitude: 43, longitude: -79, rangeKm: 10 },
    );
    expect(merged).toEqual([{ kind: "team", match: teamMatch }]);
  });
});
