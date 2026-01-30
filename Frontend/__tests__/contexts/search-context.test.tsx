import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { SearchProvider, useSearch } from "@/contexts/search-context";
import { useTeamLeagueResults } from "@/components/browse/hooks/use-team-league-results";
import type { SearchResult } from "@/components/browse/constants";

jest.mock("@/components/browse/hooks/use-team-league-results");
jest.mock("@/utils/logger", () => ({
  createScopedLog: () => ({
    info: jest.fn(),
    error: jest.fn(),
  }),
}));

const mockUseTeamLeagueResults = useTeamLeagueResults as jest.MockedFunction<
  typeof useTeamLeagueResults
>;

describe("SearchProvider", () => {
  const mockResults: SearchResult[] = [
    {
      id: "team-1",
      type: "team",
      name: "Alpha Team",
      subtitle: "Soccer Team",
      logo: "",
      sport: "Soccer",
      location: "Toronto",
    },
    {
      id: "league-1",
      type: "league",
      name: "Beta League",
      subtitle: "Soccer League",
      logo: "",
      sport: "Soccer",
      location: "Toronto",
    },
  ];

  const mockTeamLeagueResults = {
    data: mockResults,
    isLoading: false,
    teamError: null,
    leagueError: null,
    refetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeamLeagueResults.mockReturnValue(mockTeamLeagueResults as any);
  });

  it("provides initial context values", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    expect(result.current.query).toBe("");
    expect(result.current.searchActive).toBe(false);
    expect(result.current.activeMode).toBeUndefined();
    expect(result.current.results).toEqual(mockResults);
    expect(result.current.teamError).toBeNull();
    expect(result.current.leagueError).toBeNull();
  });

  it("updates state through setter functions", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    act(() => {
      result.current.setQuery("test");
      result.current.setSearchActive(true);
      result.current.setActiveMode("teams");
    });

    expect(result.current.query).toBe("test");
    expect(result.current.searchActive).toBe(true);
    expect(result.current.activeMode).toBe("teams");
  });

  it("passes onlyMine prop to useTeamLeagueResults", () => {
    renderHook(() => useSearch(), {
      wrapper: ({ children }) => (
        <SearchProvider onlyMine={true}>{children}</SearchProvider>
      ),
    });

    expect(mockUseTeamLeagueResults).toHaveBeenCalledWith("", true);
  });

  it("updates useTeamLeagueResults with query changes", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    act(() => {
      result.current.setQuery("soccer");
    });

    expect(mockUseTeamLeagueResults).toHaveBeenCalledWith("soccer", undefined);
  });

  it("provides isLoading state from useTeamLeagueResults", () => {
    mockUseTeamLeagueResults.mockReturnValue({
      ...mockTeamLeagueResults,
      isLoading: true,
    } as any);

    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("provides teamError as string when error exists", () => {
    const testError = new Error("Team fetch failed");
    mockUseTeamLeagueResults.mockReturnValue({
      ...mockTeamLeagueResults,
      teamError: testError,
    } as any);

    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    expect(result.current.teamError).toBe("Team fetch failed");
  });

  it("provides leagueError as string when error exists", () => {
    const testError = new Error("League fetch failed");
    mockUseTeamLeagueResults.mockReturnValue({
      ...mockTeamLeagueResults,
      leagueError: testError,
    } as any);

    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    expect(result.current.leagueError).toBe("League fetch failed");
  });

  it("handles both teamError and leagueError simultaneously", () => {
    const teamErr = new Error("Team error");
    const leagueErr = new Error("League error");
    mockUseTeamLeagueResults.mockReturnValue({
      ...mockTeamLeagueResults,
      teamError: teamErr,
      leagueError: leagueErr,
    } as any);

    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    expect(result.current.teamError).toBe("Team error");
    expect(result.current.leagueError).toBe("League error");
  });

  it("provides refetch function", async () => {
    const mockRefetch = jest.fn().mockResolvedValue(undefined);
    mockUseTeamLeagueResults.mockReturnValue({
      ...mockTeamLeagueResults,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockRefetch).toHaveBeenCalled();
  });

  it("provides markRendered function", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    expect(typeof result.current.markRendered).toBe("function");
    
    act(() => {
      result.current.markRendered(100);
      result.current.markRendered(250, {
        mode: "leagues",
        resultCount: 10,
        query: "custom",
      });
    });

    expect(result.current).toBeDefined();
  });

  it("provides notifyModeChange function", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    expect(typeof result.current.notifyModeChange).toBe("function");

    act(() => {
      result.current.notifyModeChange("teams", 5);
    });

    expect(result.current).toBeDefined();
  });

  it("updates results when useTeamLeagueResults data changes", () => {
    const { result, rerender } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    expect(result.current.results).toEqual(mockResults);

    const newResults: SearchResult[] = [
      {
        id: "team-2",
        type: "team",
        name: "New Team",
        subtitle: "Basketball",
        logo: "",
        sport: "Basketball",
        location: "NYC",
      },
    ];

    mockUseTeamLeagueResults.mockReturnValue({
      ...mockTeamLeagueResults,
      data: newResults,
    } as any);

    rerender({});

    expect(result.current.results).toEqual(newResults);
  });

  it("handles empty results", () => {
    mockUseTeamLeagueResults.mockReturnValue({
      ...mockTeamLeagueResults,
      data: [],
    } as any);

    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    expect(result.current.results).toEqual([]);
  });
});

describe("useSearch", () => {
  const mockTeamLeagueResults = {
    data: [],
    isLoading: false,
    teamError: null,
    leagueError: null,
    refetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeamLeagueResults.mockReturnValue(mockTeamLeagueResults as any);
  });

  it("throws error when used outside provider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSearch());
    }).toThrow("useSearch must be used within SearchProvider");

    consoleSpy.mockRestore();
  });

  it("returns context value with all properties when used inside provider", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty("query");
    expect(result.current).toHaveProperty("setQuery");
    expect(result.current).toHaveProperty("results");
    expect(result.current).toHaveProperty("searchActive");
    expect(result.current).toHaveProperty("setSearchActive");
    expect(result.current).toHaveProperty("activeMode");
    expect(result.current).toHaveProperty("setActiveMode");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("teamError");
    expect(result.current).toHaveProperty("leagueError");
    expect(result.current).toHaveProperty("markRendered");
    expect(result.current).toHaveProperty("notifyModeChange");
    expect(result.current).toHaveProperty("refetch");
  });

  it("allows state updates through context", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    act(() => {
      result.current.setQuery("test query");
      result.current.setSearchActive(true);
      result.current.setActiveMode("teams");
    });

    expect(result.current.query).toBe("test query");
    expect(result.current.searchActive).toBe(true);
    expect(result.current.activeMode).toBe("teams");
  });
});