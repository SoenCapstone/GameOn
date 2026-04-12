import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import type { MockedFunction } from "jest-mock";
import { renderHook } from "@testing-library/react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { useReferee } from "@/contexts/referee-context";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { useLeaguesByIds, useTeamsByIds } from "@/hooks/use-matches";
import { useRefereeMatches } from "@/hooks/use-referee-matches";
import type { LeagueMatch, TeamMatch, TeamSummary } from "@/types/matches";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@clerk/clerk-expo", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/contexts/referee-context", () => ({
  useReferee: jest.fn(),
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  GO_REFEREE_SERVICE_ROUTES: {
    MY_LEAGUE_MATCHES: "api/v1/referees/my-matches/league",
    MY_TEAM_MATCHES: "api/v1/referees/my-matches/team",
  },
  useAxiosWithClerk: jest.fn(),
}));

jest.mock("@/hooks/use-matches", () => ({
  useTeamsByIds: jest.fn(),
  useLeaguesByIds: jest.fn(),
}));

type RefereeMatchesData = {
  leagueMatches: LeagueMatch[];
  teamMatches: TeamMatch[];
};

type RefereeMatchesQueryKey = readonly ["referee-matches", string | null | undefined];

type RefereeMatchesQueryConfig = Pick<
  UseQueryOptions<
    RefereeMatchesData,
    Error,
    RefereeMatchesData,
    RefereeMatchesQueryKey
  >,
  "queryKey" | "queryFn" | "enabled" | "retry"
>;

type MainQueryRefetch = UseQueryResult<RefereeMatchesData, Error>["refetch"];
type MainQueryRefetchResult = Awaited<ReturnType<MainQueryRefetch>>;

type RefereeContextValue = ReturnType<typeof useReferee>;

const defaultTeamSummaryMap: Record<string, TeamSummary> = {
  h1: { id: "h1", name: "Home FC", sport: "soccer", logoUrl: null },
  a1: { id: "a1", name: "Away FC", sport: "soccer", logoUrl: null },
};

const defaultLeagueSummaryMap: Record<string, { id: string; name: string }> = {
  lg1: { id: "lg1", name: "Sunday League" },
};

const emptyRefereeMatchesData: RefereeMatchesData = {
  leagueMatches: [],
  teamMatches: [],
};

function createStubMainQueryRefetch(): MainQueryRefetch {
  const impl: MainQueryRefetch = async () =>
    ({}) as MainQueryRefetchResult;
  return jest.fn(impl) as MainQueryRefetch;
}

const mockUseQuery = useQuery as MockedFunction<typeof useQuery>;
const mockUseAuth = useAuth as MockedFunction<typeof useAuth>;
const mockUseReferee = useReferee as MockedFunction<typeof useReferee>;
const mockUseAxiosWithClerk = useAxiosWithClerk as MockedFunction<
  typeof useAxiosWithClerk
>;
const mockUseTeamsByIds = useTeamsByIds as MockedFunction<typeof useTeamsByIds>;
const mockUseLeaguesByIds = useLeaguesByIds as MockedFunction<
  typeof useLeaguesByIds
>;

function createRefereeContextValue(
  overrides: Partial<RefereeContextValue> = {},
): RefereeContextValue {
  const asyncVoid = async (): Promise<void> => {};
  const asyncStringArray = async (_value: string[]): Promise<void> => {};

  return {
    isReferee: null,
    isActive: null,
    sports: [],
    regions: [],
    loading: false,
    error: null,
    refresh: asyncVoid,
    registerAsReferee: asyncVoid,
    toggleRefereeStatus: asyncVoid,
    saveSports: asyncStringArray,
    saveRegions: asyncStringArray,
    ...overrides,
  };
}

function stubMainQueryResult(
  value: Pick<
    UseQueryResult<RefereeMatchesData, Error>,
    "data" | "isLoading" | "isRefetching" | "error" | "refetch"
  >,
): UseQueryResult<RefereeMatchesData, Error> {
  return value as UseQueryResult<RefereeMatchesData, Error>;
}

function stubTeamsByIdsResult(
  value: Pick<
    UseQueryResult<Record<string, TeamSummary>>,
    "data" | "isLoading" | "isRefetching"
  >,
): ReturnType<typeof useTeamsByIds> {
  return value as ReturnType<typeof useTeamsByIds>;
}

type LeagueSummary = { id: string; name: string };

function stubLeaguesByIdsResult(
  value: Pick<
    UseQueryResult<Record<string, LeagueSummary>>,
    "data" | "isLoading" | "isRefetching"
  >,
): ReturnType<typeof useLeaguesByIds> {
  return value as ReturnType<typeof useLeaguesByIds>;
}

function getRefereeMatchesQueryConfig(): RefereeMatchesQueryConfig {
  const firstCall = mockUseQuery.mock.calls[0]?.[0];
  if (firstCall === undefined) {
    throw new Error("Expected useQuery to have been called");
  }
  return firstCall as RefereeMatchesQueryConfig;
}

function getRefereeMatchesQueryFn(): () => Promise<RefereeMatchesData> {
  const { queryFn } = getRefereeMatchesQueryConfig();
  if (typeof queryFn !== "function") {
    throw new Error("Expected queryFn to be a function");
  }
  return queryFn as () => Promise<RefereeMatchesData>;
}

describe("useRefereeMatches", () => {
  const mockGet = jest.fn() as MockedFunction<AxiosInstance["get"]>;
  const mockApi = { get: mockGet } as Pick<AxiosInstance, "get">;

  const defaultTeamsQuery = stubTeamsByIdsResult({
    data: defaultTeamSummaryMap,
    isLoading: false,
    isRefetching: false,
  });

  const defaultLeaguesQuery = stubLeaguesByIdsResult({
    data: defaultLeagueSummaryMap,
    isLoading: false,
    isRefetching: false,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAxiosWithClerk.mockReturnValue(mockApi as AxiosInstance);
    mockUseAuth.mockReturnValue({ userId: "user-1" } as ReturnType<typeof useAuth>);
    mockUseReferee.mockReturnValue(createRefereeContextValue({ isReferee: true }));
    mockUseTeamsByIds.mockReturnValue(defaultTeamsQuery);
    mockUseLeaguesByIds.mockReturnValue(defaultLeaguesQuery);
    mockUseQuery.mockReturnValue(
      stubMainQueryResult({
        data: undefined,
        isLoading: false,
        isRefetching: false,
        error: null,
        refetch: createStubMainQueryRefetch(),
      }),
    );
  });

  it("configures the referee matches query when user is signed in and isReferee is true", () => {
    renderHook(() => useRefereeMatches());

    const options = getRefereeMatchesQueryConfig();

    expect(options.queryKey).toEqual(["referee-matches", "user-1"]);
    expect(options.enabled).toBe(true);
    expect(options.retry).toBe(false);
  });

  it("disables the query when userId is missing", () => {
    mockUseAuth.mockReturnValue({ userId: null } as ReturnType<typeof useAuth>);

    renderHook(() => useRefereeMatches());

    const options = getRefereeMatchesQueryConfig();

    expect(options.enabled).toBe(false);
  });

  it("disables the query when isReferee is not strictly true", () => {
    mockUseReferee.mockReturnValue(createRefereeContextValue({ isReferee: false }));

    renderHook(() => useRefereeMatches());

    let options = getRefereeMatchesQueryConfig();
    expect(options.enabled).toBe(false);

    mockUseQuery.mockClear();
    mockUseReferee.mockReturnValue(createRefereeContextValue({ isReferee: null }));

    renderHook(() => useRefereeMatches());

    options = getRefereeMatchesQueryConfig();
    expect(options.enabled).toBe(false);
  });

  it("fetches league and team referee assignments in parallel", async () => {
    renderHook(() => useRefereeMatches());

    const queryFn = getRefereeMatchesQueryFn();

    const leagueRow: LeagueMatch = {
      id: "lm-1",
      leagueId: "lg1",
      status: "CONFIRMED",
      homeTeamId: "h1",
      awayTeamId: "a1",
      sport: "soccer",
      startTime: "2030-01-01T16:00:00.000Z",
      endTime: "2030-01-01T18:00:00.000Z",
      requiresReferee: true,
      createdByUserId: "u0",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const teamRow: TeamMatch = {
      id: "tm-1",
      matchType: "TEAM_MATCH",
      status: "CONFIRMED",
      homeTeamId: "h1",
      awayTeamId: "a1",
      sport: "soccer",
      startTime: "2030-02-01T16:00:00.000Z",
      endTime: "2030-02-01T18:00:00.000Z",
      requiresReferee: true,
      createdByUserId: "u0",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    mockGet
      .mockResolvedValueOnce({ data: [leagueRow] })
      .mockResolvedValueOnce({ data: [teamRow] });

    const result = await queryFn();

    expect(mockGet).toHaveBeenCalledWith("api/v1/referees/my-matches/league");
    expect(mockGet).toHaveBeenCalledWith("api/v1/referees/my-matches/team");
    expect(result.leagueMatches).toHaveLength(1);
    expect(result.teamMatches).toHaveLength(1);
  });

  it("coalesces missing response data to empty arrays", async () => {
    renderHook(() => useRefereeMatches());

    const queryFn = getRefereeMatchesQueryFn();

    mockGet
      .mockResolvedValueOnce({ data: undefined })
      .mockResolvedValueOnce({ data: null });

    await expect(queryFn()).resolves.toEqual({
      leagueMatches: [],
      teamMatches: [],
    });
  });

  it("passes through refetch and error from the main query", () => {
    const refetch = createStubMainQueryRefetch();
    const err = new Error("network");

    mockUseQuery.mockReturnValue(
      stubMainQueryResult({
        data: emptyRefereeMatchesData,
        isLoading: false,
        isRefetching: false,
        error: err,
        refetch,
      }),
    );

    const { result } = renderHook(() => useRefereeMatches());

    expect(result.current.error).toBe(err);
    expect(result.current.refetch).toBe(refetch);
  });

  it("aggregates loading and refetching flags across dependent queries", () => {
    mockUseQuery.mockReturnValue(
      stubMainQueryResult({
        data: emptyRefereeMatchesData,
        isLoading: true,
        isRefetching: false,
        error: null,
        refetch: createStubMainQueryRefetch(),
      }),
    );

    const { result: resultMainLoading } = renderHook(() => useRefereeMatches());
    expect(resultMainLoading.current.isLoading).toBe(true);

    mockUseQuery.mockReturnValue(
      stubMainQueryResult({
        data: emptyRefereeMatchesData,
        isLoading: false,
        isRefetching: false,
        error: null,
        refetch: createStubMainQueryRefetch(),
      }),
    );
    mockUseTeamsByIds.mockReturnValue(
      stubTeamsByIdsResult({
        data: defaultTeamSummaryMap,
        isLoading: true,
        isRefetching: false,
      }),
    );

    const { result: resultTeamsLoading } = renderHook(() => useRefereeMatches());
    expect(resultTeamsLoading.current.isLoading).toBe(true);

    mockUseTeamsByIds.mockReturnValue(defaultTeamsQuery);
    mockUseLeaguesByIds.mockReturnValue(
      stubLeaguesByIdsResult({
        data: defaultLeagueSummaryMap,
        isLoading: false,
        isRefetching: true,
      }),
    );

    const { result: resultLeaguesRefetching } = renderHook(() =>
      useRefereeMatches(),
    );
    expect(resultLeaguesRefetching.current.isRefetching).toBe(true);
  });

  it("splits league and team cards into past and upcoming sections", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-11T14:00:00.000Z"));

    const leagueMatch: LeagueMatch = {
      id: "lm-past",
      leagueId: "lg1",
      status: "CONFIRMED",
      homeTeamId: "h1",
      awayTeamId: "a1",
      sport: "soccer",
      startTime: "2020-01-15T16:00:00.000Z",
      endTime: "2020-01-15T18:00:00.000Z",
      requiresReferee: true,
      createdByUserId: "u0",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
    };

    const teamMatch: TeamMatch = {
      id: "tm-future",
      matchType: "TEAM_MATCH",
      status: "CONFIRMED",
      homeTeamId: "h1",
      awayTeamId: "a1",
      sport: "soccer",
      startTime: "2030-06-01T16:00:00.000Z",
      endTime: "2030-06-01T18:00:00.000Z",
      requiresReferee: true,
      createdByUserId: "u0",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    mockUseQuery.mockReturnValue(
      stubMainQueryResult({
        data: { leagueMatches: [leagueMatch], teamMatches: [teamMatch] },
        isLoading: false,
        isRefetching: false,
        error: null,
        refetch: createStubMainQueryRefetch(),
      }),
    );

    const { result } = renderHook(() => useRefereeMatches());

    expect(result.current.past.map((m) => m.id)).toContain("lm-past");
    expect(result.current.past[0]).toEqual(
      expect.objectContaining({
        contextLabel: "Sunday League",
        space: "league",
        spaceId: "lg1",
      }),
    );

    expect(result.current.upcoming.map((m) => m.id)).toContain("tm-future");
    expect(result.current.upcoming[0]).toEqual(
      expect.objectContaining({ contextLabel: "Team Match" }),
    );

    jest.useRealTimers();
  });

  it("requests team and league summaries using ids from loaded matches", () => {
    const leagueMatch: LeagueMatch = {
      id: "lm-1",
      leagueId: "lg1",
      status: "CONFIRMED",
      homeTeamId: "h1",
      awayTeamId: "a1",
      sport: "soccer",
      startTime: "2030-01-01T16:00:00.000Z",
      endTime: "2030-01-01T18:00:00.000Z",
      requiresReferee: true,
      createdByUserId: "u0",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const teamMatch: TeamMatch = {
      id: "tm-1",
      matchType: "TEAM_MATCH",
      status: "CONFIRMED",
      homeTeamId: "h1",
      awayTeamId: "a2",
      sport: "soccer",
      startTime: "2030-02-01T16:00:00.000Z",
      endTime: "2030-02-01T18:00:00.000Z",
      requiresReferee: true,
      createdByUserId: "u0",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    mockUseQuery.mockReturnValue(
      stubMainQueryResult({
        data: { leagueMatches: [leagueMatch], teamMatches: [teamMatch] },
        isLoading: false,
        isRefetching: false,
        error: null,
        refetch: createStubMainQueryRefetch(),
      }),
    );

    renderHook(() => useRefereeMatches());

    expect(mockUseTeamsByIds).toHaveBeenCalledWith(
      expect.arrayContaining(["h1", "a1", "a2"]),
    );
    expect(mockUseLeaguesByIds).toHaveBeenCalledWith(["lg1"]);
  });
});
