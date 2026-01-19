import { renderHook, act, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
  GO_LEAGUE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";

import {
  useUpdateTeam,
  useDeleteTeam,
  useUpdateLeague,
  useDeleteLeague,
} from "@/hooks/use-team-league-settings";

jest.mock("@/hooks/use-axios-clerk");
jest.mock("@/utils/logger", () => ({
  createScopedLog: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

const mockUseAxiosWithClerk = useAxiosWithClerk as jest.MockedFunction<
  typeof useAxiosWithClerk
>;

const mockTeam = {
  id: "team-1",
  name: "Test Team",
  sport: "soccer",
  scope: "managed",
  location: "Montreal",
  logoUrl: "https://example.com/logo.png",
  privacy: "PUBLIC" as const,
};

const mockUpdatePayload = {
  name: "Updated Team",
  sport: "basketball",
  scope: "league_ready",
  logoUrl: "https://example.com/new-logo.png",
  location: "Toronto",
  privacy: "PRIVATE" as const,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  Wrapper.displayName = "QueryClientWrapper";

  return Wrapper;
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(async () => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("useUpdateTeam", () => {
  let mockPatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPatch = jest.fn();
    mockUseAxiosWithClerk.mockReturnValue({
      patch: mockPatch,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("updates team data successfully", async () => {
    mockPatch.mockResolvedValue({ data: mockTeam });

    const { result } = renderHook(() => useUpdateTeam("team-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mockUpdatePayload);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTeam);
    expect(mockPatch).toHaveBeenCalledWith(
      `${GO_TEAM_SERVICE_ROUTES.ALL}/team-1`,
      mockUpdatePayload,
    );
  });

  it("handles update errors correctly", async () => {
    const error = new Error("Update failed");
    mockPatch.mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateTeam("team-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mockUpdatePayload);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it("merges with provided options - onSuccess", async () => {
    mockPatch.mockResolvedValue({ data: mockTeam });

    const onSuccess = jest.fn();
    const { result } = renderHook(
      () => useUpdateTeam("team-1", { onSuccess }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      result.current.mutate(mockUpdatePayload);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("merges with provided options - onError", async () => {
    const error = new Error("Update failed");
    mockPatch.mockRejectedValue(error);

    const onError = jest.fn();
    const { result } = renderHook(() => useUpdateTeam("team-1", { onError }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mockUpdatePayload);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalled();
  });

  it("sends patch request to correct endpoint", async () => {
    mockPatch.mockResolvedValue({ data: mockTeam });

    const { result } = renderHook(() => useUpdateTeam("team-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mockUpdatePayload);
    });

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith(
        `${GO_TEAM_SERVICE_ROUTES.ALL}/team-1`,
        mockUpdatePayload,
      );
    });
  });

  it("allows multiple mutations with different payloads", async () => {
    mockPatch.mockResolvedValue({ data: mockTeam });

    const { result } = renderHook(() => useUpdateTeam("team-1"), {
      wrapper: createWrapper(),
    });

    const payload1 = { ...mockUpdatePayload, name: "Team 1" };
    const payload2 = { ...mockUpdatePayload, name: "Team 2" };

    await act(async () => {
      result.current.mutate(payload1);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    mockPatch.mockClear();

    await act(async () => {
      result.current.mutate(payload2);
    });

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith(
        `${GO_TEAM_SERVICE_ROUTES.ALL}/team-1`,
        payload2,
      );
    });
  });
});

describe("useDeleteTeam", () => {
  let mockDelete: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDelete = jest.fn();
    mockUseAxiosWithClerk.mockReturnValue({
      delete: mockDelete,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deletes team successfully", async () => {
    mockDelete.mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useDeleteTeam("team-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDelete).toHaveBeenCalledWith(
      `${GO_TEAM_SERVICE_ROUTES.ALL}/team-1`,
    );
  });

  it("handles delete errors correctly", async () => {
    const error = new Error("Delete failed");
    mockDelete.mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteTeam("team-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it("merges with provided options - onSuccess", async () => {
    mockDelete.mockResolvedValue({ data: undefined });

    const onSuccess = jest.fn();
    const { result } = renderHook(
      () => useDeleteTeam("team-1", { onSuccess }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("merges with provided options - onError", async () => {
    const error = new Error("Delete failed");
    mockDelete.mockRejectedValue(error);

    const onError = jest.fn();
    const { result } = renderHook(() => useDeleteTeam("team-1", { onError }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalled();
  });

  it("sends delete request to correct endpoint", async () => {
    mockDelete.mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useDeleteTeam("team-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(
        `${GO_TEAM_SERVICE_ROUTES.ALL}/team-1`,
      );
    });
  });

  it("allows deletion with different team IDs", async () => {
    mockDelete.mockResolvedValue({ data: undefined });

    const { result: result1 } = renderHook(() => useDeleteTeam("team-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result1.current.mutate();
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    expect(mockDelete).toHaveBeenCalledWith(
      `${GO_TEAM_SERVICE_ROUTES.ALL}/team-1`,
    );

    mockDelete.mockClear();
    mockDelete.mockResolvedValue({ data: undefined });

    const { result: result2 } = renderHook(() => useDeleteTeam("team-2"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result2.current.mutate();
    });

    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true);
    });

    expect(mockDelete).toHaveBeenCalledWith(
      `${GO_TEAM_SERVICE_ROUTES.ALL}/team-2`,
    );
  });

  it("returns void data on successful deletion", async () => {
    mockDelete.mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useDeleteTeam("team-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });
});

describe("useUpdateLeague", () => {
  let mockPatch: jest.Mock;

  const mockLeague = {
    id: "league-1",
    name: "Test League",
    sport: "soccer",
    description: "A test league",
    logoUrl: "https://example.com/league-logo.png",
    privacy: "PUBLIC" as const,
  };

  const mockLeagueUpdatePayload = {
    name: "Updated League",
    sport: "basketball",
    region: "North America",
    location: "Toronto",
    level: "intermediate",
    privacy: "PRIVATE" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPatch = jest.fn();
    mockUseAxiosWithClerk.mockReturnValue({
      patch: mockPatch,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("updates league data successfully", async () => {
    mockPatch.mockResolvedValue({ data: mockLeague });

    const { result } = renderHook(() => useUpdateLeague("league-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mockLeagueUpdatePayload);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockLeague);
    expect(mockPatch).toHaveBeenCalledWith(
      `${GO_LEAGUE_SERVICE_ROUTES.ALL}/league-1`,
      mockLeagueUpdatePayload,
    );
  });

  it("handles update errors correctly", async () => {
    const error = new Error("Update failed");
    mockPatch.mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateLeague("league-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mockLeagueUpdatePayload);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it("merges with provided options - onSuccess", async () => {
    mockPatch.mockResolvedValue({ data: mockLeague });

    const onSuccess = jest.fn();
    const { result } = renderHook(
      () => useUpdateLeague("league-1", { onSuccess }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      result.current.mutate(mockLeagueUpdatePayload);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("merges with provided options - onError", async () => {
    const error = new Error("Update failed");
    mockPatch.mockRejectedValue(error);

    const onError = jest.fn();
    const { result } = renderHook(
      () => useUpdateLeague("league-1", { onError }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      result.current.mutate(mockLeagueUpdatePayload);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalled();
  });

  it("sends patch request to correct endpoint", async () => {
    mockPatch.mockResolvedValue({ data: mockLeague });

    const { result } = renderHook(() => useUpdateLeague("league-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mockLeagueUpdatePayload);
    });

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith(
        `${GO_LEAGUE_SERVICE_ROUTES.ALL}/league-1`,
        mockLeagueUpdatePayload,
      );
    });
  });

  it("allows multiple mutations with different payloads", async () => {
    mockPatch.mockResolvedValue({ data: mockLeague });

    const { result } = renderHook(() => useUpdateLeague("league-1"), {
      wrapper: createWrapper(),
    });

    const payload1 = { ...mockLeagueUpdatePayload, name: "League 1" };
    const payload2 = { ...mockLeagueUpdatePayload, name: "League 2" };

    await act(async () => {
      result.current.mutate(payload1);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    mockPatch.mockClear();

    await act(async () => {
      result.current.mutate(payload2);
    });

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith(
        `${GO_LEAGUE_SERVICE_ROUTES.ALL}/league-1`,
        payload2,
      );
    });
  });
});

describe("useDeleteLeague", () => {
  let mockDelete: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDelete = jest.fn();
    mockUseAxiosWithClerk.mockReturnValue({
      delete: mockDelete,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deletes league successfully", async () => {
    mockDelete.mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useDeleteLeague("league-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDelete).toHaveBeenCalledWith(
      `${GO_LEAGUE_SERVICE_ROUTES.ALL}/league-1`,
    );
  });

  it("handles delete errors correctly", async () => {
    const error = new Error("Delete failed");
    mockDelete.mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteLeague("league-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it("merges with provided options - onSuccess", async () => {
    mockDelete.mockResolvedValue({ data: undefined });

    const onSuccess = jest.fn();
    const { result } = renderHook(
      () => useDeleteLeague("league-1", { onSuccess }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("merges with provided options - onError", async () => {
    const error = new Error("Delete failed");
    mockDelete.mockRejectedValue(error);

    const onError = jest.fn();
    const { result } = renderHook(
      () => useDeleteLeague("league-1", { onError }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalled();
  });

  it("sends delete request to correct endpoint", async () => {
    mockDelete.mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useDeleteLeague("league-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(
        `${GO_LEAGUE_SERVICE_ROUTES.ALL}/league-1`,
      );
    });
  });

  it("allows deletion with different league IDs", async () => {
    mockDelete.mockResolvedValue({ data: undefined });

    const { result: result1 } = renderHook(() => useDeleteLeague("league-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result1.current.mutate();
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    expect(mockDelete).toHaveBeenCalledWith(
      `${GO_LEAGUE_SERVICE_ROUTES.ALL}/league-1`,
    );

    mockDelete.mockClear();
    mockDelete.mockResolvedValue({ data: undefined });

    const { result: result2 } = renderHook(() => useDeleteLeague("league-2"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result2.current.mutate();
    });

    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true);
    });

    expect(mockDelete).toHaveBeenCalledWith(
      `${GO_LEAGUE_SERVICE_ROUTES.ALL}/league-2`,
    );
  });

  it("returns void data on successful deletion", async () => {
    mockDelete.mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useDeleteLeague("league-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });
});
