jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

import { act, renderHook } from "@testing-library/react-native";
import type { SearchResult } from "@/constants/search";
import { useSearch } from "@/hooks/search/use-search";
import { useTeamResults } from "@/hooks/search/use-team-results";
import { useLeagueResults } from "@/hooks/search/use-league-results";
import { createScopedLog } from "@/utils/logger";

jest.mock("@/hooks/search/use-team-results");
jest.mock("@/hooks/search/use-league-results");

jest.mock("@/utils/logger", () => ({
  createScopedLog: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

const mockUseTeamResults = useTeamResults as jest.MockedFunction<
  typeof useTeamResults
>;
const mockUseLeagueResults = useLeagueResults as jest.MockedFunction<
  typeof useLeagueResults
>;

function baseTeamResult(
  partial: Partial<SearchResult> & { name: string },
): SearchResult {
  return {
    id: partial.id ?? "t1",
    type: "team",
    name: partial.name,
    subtitle: partial.subtitle ?? "soccer",
    sport: partial.sport ?? "soccer",
    logo: partial.logo ?? { uri: "https://example.com/placeholder.png" },
    league: partial.league ?? "",
    location: partial.location ?? "",
    privacy: partial.privacy,
  };
}

function baseLeagueResult(
  partial: Partial<SearchResult> & { name: string },
): SearchResult {
  return {
    id: partial.id ?? "l1",
    type: "league",
    name: partial.name,
    subtitle: partial.subtitle ?? "region",
    sport: partial.sport ?? "soccer",
    logo: partial.logo ?? { uri: "https://example.com/placeholder.png" },
    league: partial.league ?? "",
    location: partial.location ?? "",
    privacy: partial.privacy,
  };
}

describe("useSearch", () => {
  const teamRefetch = jest.fn().mockResolvedValue(undefined);
  const leagueRefetch = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    teamRefetch.mockClear().mockResolvedValue(undefined);
    leagueRefetch.mockClear().mockResolvedValue(undefined);

    mockUseTeamResults.mockImplementation(() => ({
      data: [],
      raw: null,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: teamRefetch,
    }));

    mockUseLeagueResults.mockImplementation(() => ({
      data: [],
      raw: null,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: leagueRefetch,
    }));
  });

  it("merges team and league data sorted by name (base sensitivity)", () => {
    mockUseTeamResults.mockReturnValue({
      data: [baseTeamResult({ name: "Zebra FC" })],
      raw: null,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: teamRefetch,
    });
    mockUseLeagueResults.mockReturnValue({
      data: [baseLeagueResult({ name: "alpha league" })],
      raw: null,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: leagueRefetch,
    });

    const { result } = renderHook(() => useSearch());

    expect(result.current.results.map((r) => r.name)).toEqual([
      "alpha league",
      "Zebra FC",
    ]);
  });

  it("filters to public items when public option is true", () => {
    mockUseTeamResults.mockReturnValue({
      data: [
        baseTeamResult({ name: "Open", privacy: "PUBLIC" }),
        baseTeamResult({ name: "Closed", id: "t2", privacy: "PRIVATE" }),
      ],
      raw: null,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: teamRefetch,
    });
    mockUseLeagueResults.mockReturnValue({
      data: [],
      raw: null,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: leagueRefetch,
    });

    const { result } = renderHook(() => useSearch({ public: true }));

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].name).toBe("Open");
  });

  it("passes query and member into team and league hooks", () => {
    const { result } = renderHook(() => useSearch({ member: true }));

    act(() => {
      result.current.setQuery("hello");
    });

    expect(mockUseTeamResults).toHaveBeenCalledWith("hello", true);
    expect(mockUseLeagueResults).toHaveBeenCalledWith("hello", true);
  });

  it("refetches both team and league queries", async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.refetch();
    });

    expect(teamRefetch).toHaveBeenCalledTimes(1);
    expect(leagueRefetch).toHaveBeenCalledTimes(1);
  });

  it("exposes stringified team and league errors", () => {
    mockUseTeamResults.mockReturnValue({
      data: [],
      raw: null,
      isLoading: false,
      isFetching: false,
      error: new Error("teams down"),
      refetch: teamRefetch,
    });
    mockUseLeagueResults.mockReturnValue({
      data: [],
      raw: null,
      isLoading: false,
      isFetching: false,
      error: new Error("leagues down"),
      refetch: leagueRefetch,
    });

    const { result } = renderHook(() => useSearch());

    expect(result.current.teamError).toBe("teams down");
    expect(result.current.leagueError).toBe("leagues down");
  });

  it("logs search completed when results update", () => {
    const info = jest.fn();
    (createScopedLog as jest.Mock).mockReturnValue({ info, warn: jest.fn() });

    mockUseTeamResults.mockReturnValue({
      data: [baseTeamResult({ name: "One" })],
      raw: null,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: teamRefetch,
    });

    renderHook(() => useSearch({ scope: "Explore.search" }));

    expect(createScopedLog).toHaveBeenCalledWith("Explore.search");
    expect(info).toHaveBeenCalledWith(
      "search completed",
      expect.objectContaining({
        query: "",
        resultCount: 1,
      }),
    );
  });

  it("markRendered logs with opts when lastSearchRef was cleared", () => {
    const info = jest.fn();
    (createScopedLog as jest.Mock).mockReturnValue({ info, warn: jest.fn() });

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.markRendered(12, {
        mode: "teams",
        resultCount: 3,
        query: "q",
      });
    });

    expect(info).toHaveBeenCalledWith(
      "search completed",
      expect.objectContaining({
        query: "q",
        resultCount: 3,
        mode: "teams",
        tookMs: 12,
      }),
    );
  });
});
