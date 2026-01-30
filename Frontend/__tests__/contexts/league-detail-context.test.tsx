import React from "react";
import { renderHook } from "@testing-library/react-native";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import { useLeagueDetail } from "@/hooks/use-league-detail";

jest.mock("@/hooks/use-league-detail");

const mockUseLeagueDetail = useLeagueDetail as jest.MockedFunction<
  typeof useLeagueDetail
>;

describe("LeagueDetailProvider", () => {
  const mockLeagueDetail = {
    league: {
      id: "league-123",
      name: "Test League",
      sport: "Soccer",
      location: "Toronto",
    },
    isLoading: false,
    refreshing: false,
    onRefresh: jest.fn(),
    handleFollow: jest.fn(),
    title: "Test League",
    isOwner: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLeagueDetail.mockReturnValue(mockLeagueDetail as any);
  });

  it("calls useLeagueDetail with provided id", () => {
    renderHook(
      () => useLeagueDetailContext(),
      {
        wrapper: ({ children }) => (
          <LeagueDetailProvider id="league-456">{children}</LeagueDetailProvider>
        ),
      },
    );

    expect(mockUseLeagueDetail).toHaveBeenCalledWith("league-456");
  });

  it("provides context value with all properties", () => {
    const { result } = renderHook(
      () => useLeagueDetailContext(),
      {
        wrapper: ({ children }) => (
          <LeagueDetailProvider id="league-123">{children}</LeagueDetailProvider>
        ),
      },
    );

    expect(result.current.id).toBe("league-123");
    expect(result.current.league).toBeDefined();
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("onRefresh");
  });

  it("updates context when useLeagueDetail hook changes", () => {
    const { result, rerender } = renderHook(
      () => useLeagueDetailContext(),
      {
        wrapper: ({ children }) => (
          <LeagueDetailProvider id="league-123">{children}</LeagueDetailProvider>
        ),
      },
    );

    const firstValue = result.current;

    mockUseLeagueDetail.mockReturnValue({
      league: { id: "league-456", name: "Updated League" },
      isLoading: false,
      refreshing: false,
      onRefresh: jest.fn(),
      handleFollow: jest.fn(),
      title: "Updated League",
      isOwner: false,
    } as any);

    rerender({});

    expect(result.current.league?.id).not.toBe(firstValue.league?.id);
  });

  it("handles useLeagueDetail returning loading state", () => {
    mockUseLeagueDetail.mockReturnValue({
      league: null,
      isLoading: true,
      refreshing: false,
      onRefresh: jest.fn(),
      handleFollow: jest.fn(),
      title: "League",
      isOwner: false,
    } as any);

    const { result } = renderHook(
      () => useLeagueDetailContext(),
      {
        wrapper: ({ children }) => (
          <LeagueDetailProvider id="league-123">{children}</LeagueDetailProvider>
        ),
      },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.league).toBeNull();
  });

  it("handles empty league data", () => {
    mockUseLeagueDetail.mockReturnValue({
      league: null,
      isLoading: false,
      refreshing: false,
      onRefresh: jest.fn(),
      handleFollow: jest.fn(),
      title: "League",
      isOwner: false,
    } as any);

    const { result } = renderHook(
      () => useLeagueDetailContext(),
      {
        wrapper: ({ children }) => (
          <LeagueDetailProvider id="league-123">{children}</LeagueDetailProvider>
        ),
      },
    );

    expect(result.current.league).toBeNull();
    expect(result.current.title).toBe("League");
  });
});

describe("useLeagueDetailContext", () => {
  const mockLeagueDetail = {
    league: {
      id: "league-123",
      name: "Test League",
    },
    isLoading: false,
    refreshing: false,
    onRefresh: jest.fn(),
    handleFollow: jest.fn(),
    title: "Test League",
    isOwner: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLeagueDetail.mockReturnValue(mockLeagueDetail as any);
  });

  it("returns context value when used inside provider", () => {
    const { result } = renderHook(
      () => useLeagueDetailContext(),
      {
        wrapper: ({ children }) => (
          <LeagueDetailProvider id="league-123">{children}</LeagueDetailProvider>
        ),
      },
    );

    expect(result.current).toBeDefined();
    expect(result.current.id).toBe("league-123");
    expect(result.current.league?.name).toBe("Test League");
  });

  it("throws error when used outside provider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useLeagueDetailContext());
    }).toThrow("useLeagueDetailContext must be used inside provider");

    consoleSpy.mockRestore();
  });

  it("works correctly with complex league data", () => {
    const complexLeagueData = {
      league: {
        id: "league-123",
        name: "Complex League",
        sport: "Soccer",
        location: "Toronto",
        teams: ["team1", "team2"],
      },
      isLoading: false,
      refreshing: false,
      onRefresh: jest.fn(),
      handleFollow: jest.fn(),
      title: "Complex League",
      isOwner: false,
    };

    mockUseLeagueDetail.mockReturnValue(complexLeagueData as any);

    const { result } = renderHook(
      () => useLeagueDetailContext(),
      {
        wrapper: ({ children }) => (
          <LeagueDetailProvider id="league-123">{children}</LeagueDetailProvider>
        ),
      },
    );

    expect(result.current.league).toEqual(complexLeagueData.league);
    expect(result.current.league?.teams).toHaveLength(2);
  });
});