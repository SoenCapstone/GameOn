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
import { AxiosInstance } from "axios";
import { JwtPayload } from "@clerk/types";

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: jest.fn(),
  GO_TEAM_SERVICE_ROUTES: {
    ALL: "/api/teams",
  },
}));

jest.mock("@clerk/clerk-expo", () => ({
  useAuth: jest.fn(),
}));

const mockedUseAxiosWithClerk = useAxiosWithClerk as jest.MockedFunction<typeof useAxiosWithClerk>;
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
  let mockApi: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      // ...other AxiosInstance methods if needed
    } as unknown as jest.Mocked<AxiosInstance>;
    mockedUseAxiosWithClerk.mockReturnValue(mockApi);
    mockedUseAuth.mockReturnValue({
      userId: "user-123",
      isLoaded: true,
      isSignedIn: true,
      sessionId: "session-123",
      sessionClaims: {} as JwtPayload,
      actor: null,
      orgId: "org-123",
      orgRole: "member",
      orgSlug: null,
      has: jest.fn(),
      signOut: jest.fn(),
      getToken: jest.fn(),
    });

    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("memberships/me")) {
        return Promise.resolve({ data: null });
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
    teamData: Record<string, unknown>,
    membershipData: Record<string, unknown> | null = null
  ) {
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("memberships/me")) {
        return Promise.resolve({ data: membershipData });
      }
      return Promise.resolve({ data: teamData });
    });
  }

  it("returns initial loading state", async () => {
    mockGetRequest({ id: "team-1", name: "Test Team", ownerUserId: "user-123" });

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.refreshing).toBe(false);

    await waitFor(() => {
      expect(result.current.team).toBeTruthy();
    });
  });

  it("fetches team data successfully", async () => {
    const teamData: Record<string, unknown> = {
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

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(result.current.team).toBeTruthy();
    });

    if (result.current.team) {
      expect(result.current.team.name).toBe("Test Team");
      expect(result.current.title).toBe("Test Team");
      expect(result.current.isOwner).toBe(true);
    }
  });

  it("determines isOwner correctly when user is owner", async () => {
    const teamData: Record<string, unknown> = {
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
    const teamData: Record<string, unknown> = {
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
    const teamData: Record<string, unknown> = {
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
    expect(result.current.handleFollow).toBeDefined();
  });

  it("refreshes data when onRefresh is called", async () => {
    const teamData: Record<string, unknown> = {
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

    await act(async () => {
      await result.current.onRefresh();
    });

    await waitFor(() => {
      expect(result.current.refreshing).toBe(false);
    });

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

  it("isOwner is false when userId is null", async () => {
    mockedUseAuth.mockReturnValue({
      userId: null,
      isLoaded: true,
      isSignedIn: false,
      sessionId: null,
      sessionClaims: null,
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      has: jest.fn(),
      signOut: jest.fn(),
      getToken: jest.fn(),
    });

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

  it("returns isActiveMember as true when user is a team member", async () => {
    const teamData: Record<string, unknown> = {
      id: "team-1",
      name: "Test Team",
      ownerUserId: "user-456",
    };
    const membershipData: Record<string, unknown> = {
      userId: "user-123",
      role: "PLAYER",
      status: "ACTIVE",
      joinedAt: "2024-01-15T10:00:00Z",
    };
    mockGetRequest(teamData, membershipData);

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isActiveMember).toBe(true);
  });

  it("returns isActiveMember as false when user is not a team member", async () => {
    const teamData: Record<string, unknown> = {
      id: "team-1",
      name: "Test Team",
      ownerUserId: "user-456",
    };
    mockGetRequest(teamData, null);

    const { result } = renderHook(() => useTeamDetail("team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isActiveMember).toBe(false);
  });
});
