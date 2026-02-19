import { render, renderHook } from "@testing-library/react-native";
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
    TeamDetailHeader: jest.fn((props: any) =>
      mockReact.createElement("View", { testID: "team-detail-header", ...props }),
    ),
  };
});

jest.mock("@/components/leagues/league-detail-header", () => {
  const mockReact = jest.requireActual("react");
  return {
    LeagueDetailHeader: jest.fn((props: any) =>
      mockReact.createElement("View", { testID: "league-detail-header", ...props }),
    ),
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

  it("sets navigation options with TeamDetailHeader", () => {
    const onFollow = jest.fn();
    renderHook(() =>
      useTeamHeader({
        title: "Test Team",
        id: "team-1",
        isOwner: true,
        isMember: true,
        onFollow,
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
    expect(mockSetOptions).toHaveBeenCalledWith({
      headerTitle: expect.any(Function),
    });

    const setOptionsCall = mockSetOptions.mock.calls[0][0];
    const headerTitleFn = setOptionsCall.headerTitle as () => React.ReactNode;
    const result = headerTitleFn();
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
  });

  it("updates header when dependencies change", () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) =>
        useTeamHeader({
          title,
          id: "team-1",
          isOwner: false,
          isMember: false,
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

  it("does not update when dependencies are the same", () => {
    const onFollow = jest.fn();
    const props = {
      title: "Test Team",
      id: "team-1",
      isOwner: false,
      isMember: false,
      onFollow,
    };

    const { rerender } = renderHook(() => useTeamHeader(props), {
      initialProps: {},
    });

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({});

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("handles edge cases in title (empty, special characters, unicode)", () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) =>
        useTeamHeader({
          title,
          id: "team-1",
          isOwner: false,
          isMember: false,
          onFollow: jest.fn(),
        }),
      {
        initialProps: { title: "" },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ title: "Team @ #1 <Test>" });
    expect(mockSetOptions).toHaveBeenCalledTimes(2);

    rerender({ title: "Team 🏆⚽🏀" });
    expect(mockSetOptions).toHaveBeenCalledTimes(3);
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
          isMember: true,
          onFollow: jest.fn(),
        }),
      { initialProps: {} },
    );

    expect(mockSetOptions1).toHaveBeenCalledTimes(1);

    mockedUseNavigation.mockReturnValue({
      setOptions: mockSetOptions2,
    } as any);

    rerender({});

    expect(mockSetOptions2).toHaveBeenCalledTimes(1);
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

  it("sets navigation options with LeagueDetailHeader", () => {
    const onFollow = jest.fn();
    renderHook(() =>
      useLeagueHeader({
        title: "Test League",
        id: "league-1",
        isOwner: true,
        isMember: true,
        onFollow,
      }),
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
    expect(mockSetOptions).toHaveBeenCalledWith({
      headerTitle: expect.any(Function),
    });

    const setOptionsCall = mockSetOptions.mock.calls[0][0];
    const headerTitleFn = setOptionsCall.headerTitle as () => React.ReactNode;
    const result = headerTitleFn();
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
  });

  it("defaults isOwner to false when undefined", () => {
    const onFollow = jest.fn();
    renderHook(() =>
      useLeagueHeader({
        title: "Test League",
        id: "league-1",
        isMember: true,
        onFollow,
      }),
    );

    const setOptionsCall = mockSetOptions.mock.calls[0][0];
    const headerTitleFn = setOptionsCall.headerTitle as () => React.ReactNode;
    render(headerTitleFn() as React.ReactElement);

    const { LeagueDetailHeader } = jest.requireMock(
      "@/components/leagues/league-detail-header",
    );
    expect(LeagueDetailHeader).toHaveBeenCalledWith(
      expect.objectContaining({ isOwner: false }),
      undefined,
    );
  });

  it("updates header when dependencies change", () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) =>
        useLeagueHeader({
          title,
          id: "league-1",
          isOwner: false,
          isMember: false,
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

  it("does not update when dependencies are the same", () => {
    const onFollow = jest.fn();
    const props = {
      title: "Test League",
      id: "league-1",
      isOwner: false,
      isMember: false,
      onFollow,
    };

    const { rerender } = renderHook(() => useLeagueHeader(props), {
      initialProps: {},
    });

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({});

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
  });

  it("handles edge cases in title (empty, special characters, unicode)", () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) =>
        useLeagueHeader({
          title,
          id: "league-1",
          isOwner: false,
          isMember: false,
          onFollow: jest.fn(),
        }),
      {
        initialProps: { title: "" },
      },
    );

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ title: "League @ #1 <Test>" });
    expect(mockSetOptions).toHaveBeenCalledTimes(2);

    rerender({ title: "League 🏆⚽🏀" });
    expect(mockSetOptions).toHaveBeenCalledTimes(3);
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
          isMember: true,
          onFollow: jest.fn(),
        }),
      { initialProps: {} },
    );

    expect(mockSetOptions1).toHaveBeenCalledTimes(1);

    mockedUseNavigation.mockReturnValue({
      setOptions: mockSetOptions2,
    } as any);

    rerender({});

    expect(mockSetOptions2).toHaveBeenCalledTimes(1);
  });
});
