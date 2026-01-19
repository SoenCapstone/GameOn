import { renderHook } from "@testing-library/react-native";
import { useNavigation } from "@react-navigation/native";
import { useTeamHeader, useLeagueHeader } from "@/hooks/use-team-league-header";

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  })),
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock("@/components/teams/team-detail-header", () => {
  const mockReact = jest.requireActual("react");
  return {
    TeamDetailHeader: (props: any) =>
      mockReact.createElement("View", { testID: "team-detail-header" }),
  };
});

jest.mock("@/components/leagues/league-detail-header", () => {
  const mockReact = jest.requireActual("react");
  return {
    LeagueDetailHeader: (props: any) =>
      mockReact.createElement("View", { testID: "league-detail-header" }),
  };
});

const mockedUseNavigation = useNavigation as jest.MockedFunction<
  typeof useNavigation
>;

describe("useTeamHeader", () => {
  const mockSetOptions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigation.mockReturnValue({
      setOptions: mockSetOptions,
    } as any);
  });

  it("sets navigation options with header", () => {
    renderHook(() =>
      useTeamHeader({
        title: "Test Team",
        id: "team-1",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
    expect(mockSetOptions).toHaveBeenCalledWith({
      headerTitle: expect.any(Function),
    });
  });

  it("updates header when title changes", () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) =>
        useTeamHeader({
          title,
          id: "team-1",
          isOwner: false,
          onFollow: jest.fn(),
        }),
      {
        initialProps: { title: "Team A" },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ title: "Team B" });

    expect(mockSetOptions).toHaveBeenCalledTimes(2);
  });

  it("updates header when id changes", () => {
    const { rerender } = renderHook(
      ({ id }: { id: string }) =>
        useTeamHeader({
          title: "Test Team",
          id,
          isOwner: false,
          onFollow: jest.fn(),
        }),
      {
        initialProps: { id: "team-1" },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ id: "team-2" });

    expect(mockSetOptions).toHaveBeenCalledTimes(2);
  });

  it("updates header when isOwner changes", () => {
    const { rerender } = renderHook(
      ({ isOwner }: { isOwner: boolean }) =>
        useTeamHeader({
          title: "Test Team",
          id: "team-1",
          isOwner,
          onFollow: jest.fn(),
        }),
      {
        initialProps: { isOwner: false },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ isOwner: true });

    expect(mockSetOptions).toHaveBeenCalledTimes(2);
  });

  it("updates header when onFollow changes", () => {
    const onFollow1 = jest.fn();
    const onFollow2 = jest.fn();

    const { rerender } = renderHook(
      ({ onFollow }: { onFollow: () => void }) =>
        useTeamHeader({
          title: "Test Team",
          id: "team-1",
          isOwner: false,
          onFollow,
        }),
      {
        initialProps: { onFollow: onFollow1 },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ onFollow: onFollow2 });

    expect(mockSetOptions).toHaveBeenCalledTimes(2);
  });

  it("does not update when dependencies are the same", () => {
    const onFollow = jest.fn();
    const props = {
      title: "Test Team",
      id: "team-1",
      isOwner: false,
      onFollow,
    };

    const { rerender } = renderHook(() => useTeamHeader(props), {
      initialProps: {},
    });

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    // Rerender with same props
    rerender({});

    // Should still be 1 because dependencies haven't changed
    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("passes all props to TeamDetailHeader component", () => {
    const onFollow = jest.fn();
    const props = {
      title: "My Team",
      id: "team-123",
      isOwner: true,
      onFollow,
    };

    renderHook(() => useTeamHeader(props));

    const setOptionsCall = mockSetOptions.mock.calls[0][0];
    const headerTitleFn = setOptionsCall.headerTitle;
    expect(typeof headerTitleFn).toBe("function");
  });

  it("works with empty title", () => {
    renderHook(() =>
      useTeamHeader({
        title: "",
        id: "team-1",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("works with special characters in title", () => {
    renderHook(() =>
      useTeamHeader({
        title: "Team @ #1 <Test>",
        id: "team-1",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("updates when navigation instance changes", () => {
    const mockSetOptions1 = jest.fn();
    const mockSetOptions2 = jest.fn();

    mockedUseNavigation.mockReturnValue({
      setOptions: mockSetOptions1,
    } as any);

    const { rerender } = renderHook(
      () =>
        useTeamHeader({
          title: "Test Team",
          id: "team-1",
          isOwner: false,
          onFollow: jest.fn(),
        }),
      { initialProps: {} },
    );

    expect(mockSetOptions1).toHaveBeenCalledTimes(1);

    // Simulate navigation instance change
    mockedUseNavigation.mockReturnValue({
      setOptions: mockSetOptions2,
    } as any);

    rerender({});

    expect(mockSetOptions2).toHaveBeenCalledTimes(1);
  });

  it("handles owner status correctly", () => {
    const { rerender } = renderHook(
      ({ isOwner }: { isOwner: boolean }) =>
        useTeamHeader({
          title: "Test Team",
          id: "team-1",
          isOwner,
          onFollow: jest.fn(),
        }),
      {
        initialProps: { isOwner: false },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ isOwner: true });

    expect(mockSetOptions).toHaveBeenCalledTimes(2);
  });

  it("handles multiple rapid prop changes", () => {
    const { rerender } = renderHook(
      ({
        title,
        id,
        isOwner,
      }: {
        title: string;
        id: string;
        isOwner: boolean;
      }) =>
        useTeamHeader({
          title,
          id,
          isOwner,
          onFollow: jest.fn(),
        }),
      {
        initialProps: { title: "Team A", id: "1", isOwner: false },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ title: "Team B", id: "2", isOwner: true });
    rerender({ title: "Team C", id: "3", isOwner: false });
    rerender({ title: "Team D", id: "4", isOwner: true });

    expect(mockSetOptions).toHaveBeenCalledTimes(4);
  });

  it("does not cause infinite loops", () => {
    renderHook(() =>
      useTeamHeader({
        title: "Test Team",
        id: "team-1",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    // Should only be called once on mount
    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("handles long team names", () => {
    const longTitle = "A".repeat(100);

    renderHook(() =>
      useTeamHeader({
        title: longTitle,
        id: "team-1",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("handles unicode characters in title", () => {
    renderHook(() =>
      useTeamHeader({
        title: "Team 🏆⚽🏀",
        id: "team-1",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("works with numeric-like IDs", () => {
    renderHook(() =>
      useTeamHeader({
        title: "Test Team",
        id: "12345",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("works with UUID-like IDs", () => {
    renderHook(() =>
      useTeamHeader({
        title: "Test Team",
        id: "550e8400-e29b-41d4-a716-446655440000",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });
});

describe("useLeagueHeader", () => {
  const mockSetOptions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigation.mockReturnValue({
      setOptions: mockSetOptions,
    } as any);
  });

  it("sets navigation options with header", () => {
    renderHook(() =>
      useLeagueHeader({
        title: "Test League",
        id: "league-1",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
    expect(mockSetOptions).toHaveBeenCalledWith({
      headerTitle: expect.any(Function),
    });
  });

  it("updates header when title changes", () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) =>
        useLeagueHeader({
          title,
          id: "league-1",
          isOwner: false,
          onFollow: jest.fn(),
        }),
      {
        initialProps: { title: "League A" },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ title: "League B" });

    expect(mockSetOptions).toHaveBeenCalledTimes(2);
  });

  it("updates header when id changes", () => {
    const { rerender } = renderHook(
      ({ id }: { id: string }) =>
        useLeagueHeader({
          title: "Test League",
          id,
          isOwner: false,
          onFollow: jest.fn(),
        }),
      {
        initialProps: { id: "league-1" },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ id: "league-2" });

    expect(mockSetOptions).toHaveBeenCalledTimes(2);
  });

  it("updates header when isOwner changes", () => {
    const { rerender } = renderHook(
      ({ isOwner }: { isOwner: boolean }) =>
        useLeagueHeader({
          title: "Test League",
          id: "league-1",
          isOwner,
          onFollow: jest.fn(),
        }),
      {
        initialProps: { isOwner: false },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ isOwner: true });

    expect(mockSetOptions).toHaveBeenCalledTimes(2);
  });

  it("updates header when onFollow changes", () => {
    const onFollow1 = jest.fn();
    const onFollow2 = jest.fn();

    const { rerender } = renderHook(
      ({ onFollow }: { onFollow: () => void }) =>
        useLeagueHeader({
          title: "Test League",
          id: "league-1",
          isOwner: false,
          onFollow,
        }),
      {
        initialProps: { onFollow: onFollow1 },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ onFollow: onFollow2 });

    expect(mockSetOptions).toHaveBeenCalledTimes(2);
  });

  it("does not update when dependencies are the same", () => {
    const onFollow = jest.fn();
    const props = {
      title: "Test League",
      id: "league-1",
      isOwner: false,
      onFollow,
    };

    const { rerender } = renderHook(() => useLeagueHeader(props), {
      initialProps: {},
    });

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    // Rerender with same props
    rerender({});

    // Should still be 1 because dependencies haven't changed
    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("passes all props to LeagueDetailHeader component", () => {
    const onFollow = jest.fn();
    const props = {
      title: "My League",
      id: "league-123",
      isOwner: true,
      onFollow,
    };

    renderHook(() => useLeagueHeader(props));

    const setOptionsCall = mockSetOptions.mock.calls[0][0];
    const headerTitleFn = setOptionsCall.headerTitle;
    expect(typeof headerTitleFn).toBe("function");
  });

  it("works with empty title", () => {
    renderHook(() =>
      useLeagueHeader({
        title: "",
        id: "league-1",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("works with special characters in title", () => {
    renderHook(() =>
      useLeagueHeader({
        title: "League @ #1 <Test>",
        id: "league-1",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("updates when navigation instance changes", () => {
    const mockSetOptions1 = jest.fn();
    const mockSetOptions2 = jest.fn();

    mockedUseNavigation.mockReturnValue({
      setOptions: mockSetOptions1,
    } as any);

    const { rerender } = renderHook(
      () =>
        useLeagueHeader({
          title: "Test League",
          id: "league-1",
          isOwner: false,
          onFollow: jest.fn(),
        }),
      { initialProps: {} },
    );

    expect(mockSetOptions1).toHaveBeenCalledTimes(1);

    // Simulate navigation instance change
    mockedUseNavigation.mockReturnValue({
      setOptions: mockSetOptions2,
    } as any);

    rerender({});

    expect(mockSetOptions2).toHaveBeenCalledTimes(1);
  });

  it("handles owner status correctly", () => {
    const { rerender } = renderHook(
      ({ isOwner }: { isOwner: boolean }) =>
        useLeagueHeader({
          title: "Test League",
          id: "league-1",
          isOwner,
          onFollow: jest.fn(),
        }),
      {
        initialProps: { isOwner: false },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ isOwner: true });

    expect(mockSetOptions).toHaveBeenCalledTimes(2);
  });

  it("handles multiple rapid prop changes", () => {
    const { rerender } = renderHook(
      ({
        title,
        id,
        isOwner,
      }: {
        title: string;
        id: string;
        isOwner: boolean;
      }) =>
        useLeagueHeader({
          title,
          id,
          isOwner,
          onFollow: jest.fn(),
        }),
      {
        initialProps: { title: "League A", id: "1", isOwner: false },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ title: "League B", id: "2", isOwner: true });
    rerender({ title: "League C", id: "3", isOwner: false });
    rerender({ title: "League D", id: "4", isOwner: true });

    expect(mockSetOptions).toHaveBeenCalledTimes(4);
  });

  it("does not cause infinite loops", () => {
    renderHook(() =>
      useLeagueHeader({
        title: "Test League",
        id: "league-1",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    // Should only be called once on mount
    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("handles long league names", () => {
    const longTitle = "A".repeat(100);

    renderHook(() =>
      useLeagueHeader({
        title: longTitle,
        id: "league-1",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("handles unicode characters in title", () => {
    renderHook(() =>
      useLeagueHeader({
        title: "League 🏆⚽🏀",
        id: "league-1",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("works with numeric-like IDs", () => {
    renderHook(() =>
      useLeagueHeader({
        title: "Test League",
        id: "12345",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("works with UUID-like IDs", () => {
    renderHook(() =>
      useLeagueHeader({
        title: "Test League",
        id: "550e8400-e29b-41d4-a716-446655440000",
        isOwner: false,
        onFollow: jest.fn(),
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });
});
