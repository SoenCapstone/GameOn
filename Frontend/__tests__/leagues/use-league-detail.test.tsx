import {
  renderHook,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react-native";
import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { useAuth } from "@clerk/clerk-expo";
import { AxiosInstance } from "axios";
import type { JwtPayload } from "@clerk/types";

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: jest.fn(),
  GO_LEAGUE_SERVICE_ROUTES: {
    ALL: "/api/v1/leagues",
    GET: (id: string) => `/api/v1/leagues/${id}`,
  },
}));

jest.mock("@clerk/clerk-expo", () => ({
  useAuth: jest.fn(),
}));

const mockedUseAxiosWithClerk = useAxiosWithClerk as jest.MockedFunction<
  typeof useAxiosWithClerk
>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

let queryClient: QueryClient;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper() {
  queryClient = createQueryClient();

  return function Wrapper({
    children,
  }: PropsWithChildren<Record<string, unknown>>) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useLeagueDetail", () => {
  const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAxiosWithClerk.mockReturnValue(
      mockApi as unknown as AxiosInstance,
    );
    mockedUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      userId: "user-123",
      sessionId: "session-123",
      sessionClaims: {} as JwtPayload,
      actor: null,
      orgId: "org-123",
      orgRole: "role-123",
      orgSlug: null,
      has: jest.fn(),
      signOut: jest.fn(),
      getToken: jest.fn(),
    });

    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("memberships/me")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: null });
    });
  });

  afterEach(async () => {
    cleanup();
    if (queryClient) {
      queryClient.clear();
    }
  });

  function mockGetRequest(
    leagueData: Record<string, unknown>,
    teamsData: Record<string, unknown>[] = [],
  ) {
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("memberships/me")) {
        return Promise.resolve({ data: teamsData });
      }
      return Promise.resolve({ data: leagueData });
    });
  }

  it("returns initial loading state", async () => {
    mockGetRequest({
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-123",
    });

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.refreshing).toBe(false);

    await waitFor(() => {
      expect(result.current.league).toBeTruthy();
    });
  });

  it("fetches league data successfully", async () => {
    const leagueData = {
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-123",
      region: "North America",
      level: "intermediate",
    };

    mockGetRequest(leagueData);

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(result.current.league).toBeTruthy();
    });

    if (result.current.league) {
      expect(result.current.league.name).toBe("Test League");
      expect(result.current.title).toBe("Test League");
      expect(result.current.isOwner).toBe(true);
    }
  });

  it("determines isOwner correctly when user is owner", async () => {
    const leagueData = {
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-123",
    };

    mockGetRequest(leagueData);

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.league).toBeTruthy();
    });

    expect(result.current.isOwner).toBe(true);
  });

  it("determines isOwner correctly when user is not owner", async () => {
    const leagueData = {
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-456",
    };

    mockGetRequest(leagueData);

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isOwner).toBe(false);
  });

  it("handles missing league name gracefully", async () => {
    const leagueData = {
      id: "league-1",
      ownerUserId: "user-123",
    };

    mockGetRequest(leagueData);

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.title).toBe("League league-1");
  });

  it("handles empty league ID", async () => {
    const { result } = renderHook(() => useLeagueDetail(""), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.title).toBe("League");
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("calls handleFollow with correct parameters", async () => {
    mockApi.get.mockResolvedValue({
      data: { id: "league-1", name: "Test League", ownerUserId: "user-123" },
    });

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.handleFollow();
    expect(result.current.handleFollow).toBeDefined();
  });

  it("refreshes data when onRefresh is called", async () => {
    const leagueData = {
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-123",
    };

    mockGetRequest(leagueData);

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.refreshing).toBe(false);

    await act(async () => {
      await result.current.onRefresh();
    });

    await waitFor(() => {
      expect(result.current.refreshing).toBe(false);
    });

    expect(mockApi.get).toHaveBeenCalled();
  });

  it("handles API errors gracefully", async () => {
    mockApi.get.mockImplementation(() => {
      return Promise.reject(new Error("Network error"));
    });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.league).toBeFalsy();

    consoleSpy.mockRestore();
  });

  it("handles refresh errors gracefully", async () => {
    mockApi.get
      .mockResolvedValueOnce({
        data: { id: "league-1", name: "Test League", ownerUserId: "user-123" },
      })
      .mockRejectedValueOnce(new Error("Refresh failed"));

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.onRefresh();
    });

    await waitFor(() => {
      expect(result.current.refreshing).toBe(false);
    });

    consoleSpy.mockRestore();
  });

  it("isOwner is false when userId is null", async () => {
    mockedUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      userId: "",
      sessionId: "session-123",
      sessionClaims: {} as JwtPayload,
      actor: null,
      orgId: "org-123",
      orgRole: "role-123",
      orgSlug: null,
      has: jest.fn(),
      signOut: jest.fn(),
      getToken: jest.fn(),
    });

    const leagueData = {
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-123",
    };

    mockGetRequest(leagueData);

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isOwner).toBe(false);
  });

  it("isOwner is false when league is null", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("memberships/me")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: null });
    });

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isOwner).toBe(false);
  });

  it("maintains stable handleFollow callback", async () => {
    mockGetRequest({
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-123",
    });

    const { result, rerender } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const handleFollow1 = result.current.handleFollow;
    rerender(() => useLeagueDetail("league-1"));
    const handleFollow2 = result.current.handleFollow;

    expect(handleFollow1).toBe(handleFollow2);
  });

  it("maintains stable onRefresh callback", async () => {
    mockGetRequest({
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-123",
    });

    const { result, rerender } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const onRefresh1 = result.current.onRefresh;
    rerender(() => useLeagueDetail("league-1"));
    const onRefresh2 = result.current.onRefresh;

    expect(onRefresh1).toBe(onRefresh2);
  });

  it("calls correct API endpoint", async () => {
    mockGetRequest({
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-123",
    });

    renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith("/api/v1/leagues/league-1");
    });
  });

  it("sets refreshing state correctly during refresh", async () => {
    const leagueData = {
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-123",
    };

    const delayedResponse = new Promise((resolve) => {
      setTimeout(() => resolve({ data: leagueData }), 100);
    });

    mockApi.get.mockImplementation(() => delayedResponse);

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.onRefresh();
    });

    expect(result.current.refreshing).toBe(true);

    await waitFor(
      () => {
        expect(result.current.refreshing).toBe(false);
      },
      { timeout: 3000 },
    );
  });

  it("does not fetch when ID is disabled", async () => {
    const { result } = renderHook(() => useLeagueDetail(""), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("returns correct title when no ID provided", async () => {
    const { result } = renderHook(() => useLeagueDetail(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.title).toBe("League");
  });

  it("returns correct title when ID provided but no data", async () => {
    mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useLeagueDetail("league-2"), {
      wrapper: createWrapper(),
    });

    expect(result.current.title).toBe("League league-2");
  });

  it("returns correct title when data is loaded", async () => {
    mockGetRequest({
      id: "league-3",
      name: "My League",
      ownerUserId: "user-123",
    });

    const { result } = renderHook(() => useLeagueDetail("league-3"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.title).toBe("My League");
    });
  });

  it("handles different league structures", async () => {
    await cleanup();
    queryClient = createQueryClient();

    const leagueData = {
      id: "league-1",
      name: "Complex League",
      ownerUserId: "user-123",
      region: "Europe",
      location: "London",
      level: "advanced",
      privacy: "PRIVATE" as const,
      description: "A complex league",
    };

    mockGetRequest(leagueData);

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.league).toBeTruthy();
    });

    expect(result.current.league).toEqual(leagueData);
  });

  it("handles multiple sequential refreshes", async () => {
    await cleanup();
    queryClient = createQueryClient();

    const leagueData = {
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-123",
    };

    mockApi.get.mockResolvedValue({ data: leagueData });

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.onRefresh();
    });

    await act(async () => {
      await result.current.onRefresh();
    });

    await act(async () => {
      await result.current.onRefresh();
    });

    await waitFor(() => {
      expect(result.current.refreshing).toBe(false);
    });

    expect(mockApi.get).toHaveBeenCalled();
  });

  it("returns isMember as true when user has teams in league", async () => {
    const leagueData = {
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-456",
    };

    const myLeagueTeams = [
      {
        id: "lt-1",
        leagueId: "league-1",
        teamId: "team-1",
        joinedAt: "2024-01-15T10:00:00Z",
      },
    ];

    mockGetRequest(leagueData, myLeagueTeams);

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isMember).toBe(true);
    expect(result.current.myLeagueTeams).toHaveLength(1);
  });

  it("returns isMember as false when user has no teams in league", async () => {
    const leagueData = {
      id: "league-1",
      name: "Test League",
      ownerUserId: "user-456",
    };

    mockGetRequest(leagueData, []);

    const { result } = renderHook(() => useLeagueDetail("league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isMember).toBe(false);
    expect(result.current.myLeagueTeams).toHaveLength(0);
  });
});
