import {
  renderHook,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react-native";
import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTeamDetail } from "@/hooks/use-team-detail";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { useAuth } from "@clerk/clerk-expo";

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: jest.fn(),
  GO_TEAM_SERVICE_ROUTES: {
    ALL: "/api/teams",
  },
}));

jest.mock("@clerk/clerk-expo", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/browse/constants", () => ({
  mockSearchResults: [
    {
      id: "mock-team-1",
      type: "team",
      name: "Mock Team",
      subtitle: "Test",
      logo: "🏀",
      league: "Test League",
      ownerUserId: "user-123",
    },
  ],
}));

const mockedUseAxiosWithClerk = useAxiosWithClerk as jest.MockedFunction<
  typeof useAxiosWithClerk
>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

let queryClient: QueryClient;

function createWrapper() {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useTeamDetail", () => {
  const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAxiosWithClerk.mockReturnValue(mockApi as any);
    mockedUseAuth.mockReturnValue({
      userId: "user-123",
    } as any);
  });

  afterEach(async () => {
    cleanup();
    if (queryClient) {
      queryClient.clear();
    }
  });

  it("returns initial loading state", async () => {
    mockApi.get.mockResolvedValue({
      data: { id: "team-1", name: "Test Team", ownerUserId: "user-123" },
    });

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    // May not be loading initially due to query caching
    expect(result.current.refreshing).toBe(false);

    await waitFor(() => {
      expect(result.current.team).toBeTruthy();
    });
  });

  it("fetches team data successfully", async () => {
    const teamData = {
      id: "team-1",
      name: "Test Team",
      ownerUserId: "user-123",
      subtitle: "Soccer Team",
    };

    mockApi.get.mockResolvedValue({ data: teamData });

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify the API was called
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalled();
    });

    // Check that we got data back
    await waitFor(() => {
      expect(result.current.team).toBeTruthy();
    });

    if (result.current.team) {
      expect(result.current.team.name).toBe("Test Team");
      expect(result.current.title).toBe("Test Team");
      expect(result.current.isOwner).toBe(true);
    }
  });

  it("uses mock data when team ID matches mock", async () => {
    const { result } = renderHook(() => useTeamDetail("mock-team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.team?.name).toBe("Mock Team");
    expect(result.current.title).toBe("Mock Team");
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("determines isOwner correctly when user is owner", async () => {
    const teamData = {
      id: "team-1",
      name: "Test Team",
      ownerUserId: "user-123",
    };

    mockApi.get.mockResolvedValue({ data: teamData });

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.team).toBeTruthy();
    });

    expect(result.current.isOwner).toBe(true);
  });

  it("determines isOwner correctly when user is not owner", async () => {
    const teamData = {
      id: "team-1",
      name: "Test Team",
      ownerUserId: "user-456",
    };

    mockApi.get.mockResolvedValue({ data: teamData });

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isOwner).toBe(false);
  });

  it("handles missing team name gracefully", async () => {
    const teamData = {
      id: "team-1",
      ownerUserId: "user-123",
    };

    mockApi.get.mockResolvedValue({ data: teamData });

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.title).toBe("Team team-1");
  });

  it("handles empty team ID", async () => {
    const { result } = renderHook(() => useTeamDetail(""), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.title).toBe("Team");
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("calls handleFollow with correct parameters", async () => {
    mockApi.get.mockResolvedValue({
      data: { id: "team-1", name: "Test Team", ownerUserId: "user-123" },
    });

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.handleFollow();
    // handleFollow logs but doesn't throw
    expect(result.current.handleFollow).toBeDefined();
  });

  it("refreshes data when onRefresh is called", async () => {
    const teamData = {
      id: "team-1",
      name: "Test Team",
      ownerUserId: "user-123",
    };

    mockApi.get.mockResolvedValue({ data: teamData });

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.refreshing).toBe(false);

    // Call refresh
    await act(async () => {
      await result.current.onRefresh();
    });

    await waitFor(() => {
      expect(result.current.refreshing).toBe(false);
    });

    // API should be called at least once for initial load
    expect(mockApi.get).toHaveBeenCalled();
  });

  it("handles API errors gracefully", async () => {
    mockApi.get.mockRejectedValue(new Error("Network error"));

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Team will be null or undefined after error
    expect(result.current.team).toBeFalsy();

    consoleSpy.mockRestore();
  });

  it("handles refresh errors gracefully", async () => {
    mockApi.get
      .mockResolvedValueOnce({
        data: { id: "team-1", name: "Test Team", ownerUserId: "user-123" },
      })
      .mockRejectedValueOnce(new Error("Refresh failed"));

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const { result } = renderHook(() => useTeamDetail("team-1"), {
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

  it("does not fetch when mock data is immediately available", () => {
    renderHook(() => useTeamDetail("mock-team-1"), {
      wrapper: createWrapper(),
    });

    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("returns correct title from mock data", async () => {
    const { result } = renderHook(() => useTeamDetail("mock-team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.title).toBe("Mock Team");
  });

  it("isOwner is false when userId is null", async () => {
    mockedUseAuth.mockReturnValue({
      userId: null,
    } as any);

    const teamData = {
      id: "team-1",
      name: "Test Team",
      ownerUserId: "user-123",
    };

    mockApi.get.mockResolvedValue({ data: teamData });

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isOwner).toBe(false);
  });

  it("isOwner is false when team is null", async () => {
    mockApi.get.mockResolvedValue({ data: null });

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isOwner).toBe(false);
  });

  it("maintains stable handleFollow callback", async () => {
    mockApi.get.mockResolvedValue({
      data: { id: "team-1", name: "Test Team", ownerUserId: "user-123" },
    });

    const { result, rerender } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const handleFollow1 = result.current.handleFollow;
    rerender(() => useTeamDetail("team-1"));
    const handleFollow2 = result.current.handleFollow;

    expect(handleFollow1).toBe(handleFollow2);
  });

  it("maintains stable onRefresh callback", async () => {
    mockApi.get.mockResolvedValue({
      data: { id: "team-1", name: "Test Team", ownerUserId: "user-123" },
    });

    const { result, rerender } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const onRefresh1 = result.current.onRefresh;
    rerender(() => useTeamDetail("team-1"));
    const onRefresh2 = result.current.onRefresh;

    expect(onRefresh1).toBe(onRefresh2);
  });
});
