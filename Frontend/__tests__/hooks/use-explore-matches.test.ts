import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useQuery } from "@tanstack/react-query";
import { useExploreMatches } from "@/hooks/use-explore-matches";
import {
  buildExploreMatchesBody,
  buildExploreMatchesQueryKey,
} from "@/utils/explore";
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

  it("omits the sport field when the preference is set to All", () => {
    renderHook(() =>
      useExploreMatches({
        latitude: 43,
        longitude: -79,
        rangeKm: 25,
        sport: " All ",
      }),
    );

    expect(useQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enabled: true,
        queryKey: buildExploreMatchesQueryKey({
          latitude: 43,
          longitude: -79,
          rangeKm: 25,
        }),
      }),
    );
  });

  it("returns an empty array from the query function when the request body is invalid", async () => {
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

    renderHook(() =>
      useExploreMatches({
        latitude: undefined,
        longitude: -79,
        rangeKm: 25,
        sport: "soccer",
      }),
    );

    expect(buildExploreMatchesBody({ longitude: -79, rangeKm: 25 })).toBeNull();
    await expect(capturedQueryFn?.()).resolves.toEqual([]);
    expect(mockApi.post).not.toHaveBeenCalled();
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
        queryKey: buildExploreMatchesQueryKey({
          latitude: 43,
          longitude: -79,
          rangeKm: 25,
          sport: "soccer",
        }),
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

  it("falls back to empty endpoint payloads when responses are missing data", async () => {
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

    mockApi.post.mockResolvedValue({ data: undefined });

    renderHook(() =>
      useExploreMatches({
        latitude: 43,
        longitude: -79,
        rangeKm: 25,
      }),
    );

    await expect(capturedQueryFn?.()).resolves.toEqual([]);
    expect(mockApi.post).toHaveBeenCalledTimes(2);
  });

  it("returns an empty matches array by default", () => {
    const { result } = renderHook(() =>
      useExploreMatches({
        latitude: 43,
        longitude: -79,
        rangeKm: 25,
      }),
    );

    expect(result.current.matches).toEqual([]);
    expect(result.current.isRefreshing).toBe(false);
  });

  it("toggles isRefreshing around a successful refresh", async () => {
    let resolveRefetch!: () => void;
    const refetch = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveRefetch = () => resolve({});
        }),
    );
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    });

    const { result } = renderHook(() =>
      useExploreMatches({
        latitude: 43,
        longitude: -79,
        rangeKm: 25,
      }),
    );

    let refreshPromise!: Promise<void>;
    act(() => {
      refreshPromise = result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(true);
    });

    await act(async () => {
      resolveRefetch();
      await refreshPromise;
    });

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(result.current.isRefreshing).toBe(false);
  });

  it("resets isRefreshing when refresh fails", async () => {
    const refetch = jest.fn().mockRejectedValue(new Error("refresh failed"));
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    });

    const { result } = renderHook(() =>
      useExploreMatches({
        latitude: 43,
        longitude: -79,
        rangeKm: 25,
      }),
    );

    await act(async () => {
      await expect(result.current.refresh()).rejects.toThrow("refresh failed");
    });

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(result.current.isRefreshing).toBe(false);
  });
});
