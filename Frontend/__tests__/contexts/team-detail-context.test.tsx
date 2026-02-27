import React from "react";
import { renderHook } from "@testing-library/react-native";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { useTeamDetail } from "@/hooks/use-team-detail";

jest.mock("@/hooks/use-team-detail");

const mockUseTeamDetail = useTeamDetail as jest.MockedFunction<
  typeof useTeamDetail
>;

describe("TeamDetailProvider", () => {
  const mockTeamDetail = {
    team: {
      id: "team-123",
      name: "Test Team",
      sport: "Soccer",
      location: "Toronto",
    },
    isLoading: false,
    refreshing: false,
    onRefresh: jest.fn(),
    handleFollow: jest.fn(),
    title: "Test Team",
    isOwner: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeamDetail.mockReturnValue(mockTeamDetail as unknown as ReturnType<typeof useTeamDetail>);
  });

  it("calls useTeamDetail with provided id and provides all properties", () => {
    const { result } = renderHook(
      () => useTeamDetailContext(),
      {
        wrapper: ({ children }) => (
          <TeamDetailProvider id="team-456">{children}</TeamDetailProvider>
        ),
      },
    );

    expect(mockUseTeamDetail).toHaveBeenCalledWith("team-456");
    expect(result.current.id).toBe("team-456");
    expect(result.current).toHaveProperty("team");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("onRefresh");
  });

  it("updates context when useTeamDetail hook changes", () => {
    const { result, rerender } = renderHook(
      () => useTeamDetailContext(),
      {
        wrapper: ({ children }) => (
          <TeamDetailProvider id="team-123">{children}</TeamDetailProvider>
        ),
      },
    );

    const firstValue = result.current;

    mockUseTeamDetail.mockReturnValue({
      team: { id: "team-456", name: "Updated Team" },
      isLoading: false,
      refreshing: false,
      onRefresh: jest.fn(),
      handleFollow: jest.fn(),
      title: "Updated Team",
      isOwner: false,
    } as unknown as ReturnType<typeof useTeamDetail>);

    rerender({});

    expect(result.current.team?.id).not.toBe(firstValue.team?.id);
  });

  it("handles useTeamDetail returning loading state", () => {
    mockUseTeamDetail.mockReturnValue({
      team: null,
      isLoading: true,
      refreshing: false,
      onRefresh: jest.fn(),
      handleFollow: jest.fn(),
      title: "Team",
      isOwner: false,
    } as unknown as ReturnType<typeof useTeamDetail>);

    const { result } = renderHook(
      () => useTeamDetailContext(),
      {
        wrapper: ({ children }) => (
          <TeamDetailProvider id="team-123">{children}</TeamDetailProvider>
        ),
      },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.team).toBeNull();
  });

  it("handles empty team data", () => {
    mockUseTeamDetail.mockReturnValue({
      team: null,
      isLoading: false,
      refreshing: false,
      onRefresh: jest.fn(),
      handleFollow: jest.fn(),
      title: "Team",
      isOwner: false,
    } as unknown as ReturnType<typeof useTeamDetail>);

    const { result } = renderHook(
      () => useTeamDetailContext(),
      {
        wrapper: ({ children }) => (
          <TeamDetailProvider id="team-123">{children}</TeamDetailProvider>
        ),
      },
    );

    expect(result.current.team).toBeNull();
    expect(result.current.title).toBe("Team");
  });
});

describe("useTeamDetailContext", () => {
  const mockTeamDetail = {
    team: {
      id: "team-123",
      name: "Test Team",
    },
    isLoading: false,
    refreshing: false,
    onRefresh: jest.fn(),
    handleFollow: jest.fn(),
    title: "Test Team",
    isOwner: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeamDetail.mockReturnValue(mockTeamDetail as unknown as ReturnType<typeof useTeamDetail>);
  });

  it("returns context value when used inside provider", () => {
    const { result } = renderHook(
      () => useTeamDetailContext(),
      {
        wrapper: ({ children }) => (
          <TeamDetailProvider id="team-123">{children}</TeamDetailProvider>
        ),
      },
    );

    expect(result.current).toBeDefined();
    expect(result.current.id).toBe("team-123");
    expect(result.current.team?.name).toBe("Test Team");
  });

  it("throws error when used outside provider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTeamDetailContext());
    }).toThrow("useTeamDetailContext must be used inside provider");

    consoleSpy.mockRestore();
  });

  it("works correctly with complex team data", () => {
    const complexTeamData = {
      team: {
        id: "team-123",
        name: "Complex Team",
        sport: "Soccer",
        location: "Toronto",
      },
      isLoading: false,
      refreshing: false,
      onRefresh: jest.fn(),
      handleFollow: jest.fn(),
      title: "Complex Team",
      isOwner: false,
    };

    mockUseTeamDetail.mockReturnValue(complexTeamData as unknown as ReturnType<typeof useTeamDetail>);

    const { result } = renderHook(
      () => useTeamDetailContext(),
      {
        wrapper: ({ children }) => (
          <TeamDetailProvider id="team-123">{children}</TeamDetailProvider>
        ),
      },
    );

    expect(result.current.team).toEqual(complexTeamData.team);
  });
});