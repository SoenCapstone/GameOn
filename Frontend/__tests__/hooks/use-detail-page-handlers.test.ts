import { renderHook, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import { toast } from "@/utils/toast";
import { useDetailPageHandlers } from "@/hooks/use-detail-page-handlers";
import * as logger from "@/utils/logger";

jest.mock("@/utils/logger", () => ({
  createScopedLog: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock("@/utils/error", () => ({
  errorToString: jest.fn(String),
}));

jest.mock("@/utils/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
    promise: jest.fn(),
    dismiss: jest.fn(),
    wiggle: jest.fn(),
    custom: jest.fn(),
  },
}));

jest.spyOn(Alert, "alert");

describe("useDetailPageHandlers", () => {
  const mockConfig = {
    id: "test-id-123",
    currentTab: "board",
    boardPosts: [{}, {}, {}],
    onRefresh: jest.fn(),
    refetchPosts: jest.fn(),
    deletePostMutation: {
      mutateAsync: jest.fn(),
    },
    entityName: "Team",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig.onRefresh.mockResolvedValue(undefined);
    mockConfig.refetchPosts.mockResolvedValue(undefined);
    mockConfig.deletePostMutation.mutateAsync.mockResolvedValue(undefined);
  });

  describe("handleDeletePost", () => {
    it("shows confirmation alert with correct options", () => {
      const { result } = renderHook(() => useDetailPageHandlers(mockConfig));

      act(() => {
        result.current.handleDeletePost("post-123");
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Delete Post",
        "Are you sure you want to delete this post?",
        expect.arrayContaining([
          expect.objectContaining({ text: "Cancel" }),
          expect.objectContaining({ text: "Delete", style: "destructive" }),
        ]),
      );
    });

    it("deletes post when confirmed", async () => {
      const { result } = renderHook(() => useDetailPageHandlers(mockConfig));

      act(() => {
        result.current.handleDeletePost("post-123");
      });

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteButton = alertCall[2].find(
        (btn: { text: string; style?: string; onPress?: () => void }) =>
          btn.text === "Delete",
      );

      await act(async () => {
        await deleteButton.onPress();
      });

      expect(mockConfig.deletePostMutation.mutateAsync).toHaveBeenCalledWith(
        "post-123",
      );
    });

    it("shows error toast when deletion fails", async () => {
      const error = new Error("Network error");
      mockConfig.deletePostMutation.mutateAsync.mockRejectedValue(error);

      const { result } = renderHook(() => useDetailPageHandlers(mockConfig));

      act(() => {
        result.current.handleDeletePost("post-123");
      });

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteButton = alertCall[2].find(
        (btn: { text: string; style?: string; onPress?: () => void }) =>
          btn.text === "Delete",
      );

      await act(async () => {
        await deleteButton.onPress();
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed To Delete",
          expect.objectContaining({
            description: "Error: Network error",
          }),
        );
      });
    });
  });

  describe("handleRefresh", () => {
    it("sets refreshing state during refresh", async () => {
      const { result } = renderHook(() => useDetailPageHandlers(mockConfig));

      expect(result.current.refreshing).toBe(false);

      let refreshPromise: Promise<void>;
      act(() => {
        refreshPromise = result.current.handleRefresh();
      });

      await waitFor(() => {
        expect(result.current.refreshing).toBe(true);
      });

      await act(async () => {
        await refreshPromise;
      });

      expect(result.current.refreshing).toBe(false);
    });

    it("calls onRefresh and refetchPosts when on board tab", async () => {
      const { result } = renderHook(() => useDetailPageHandlers(mockConfig));

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockConfig.onRefresh).toHaveBeenCalledTimes(1);
      expect(mockConfig.refetchPosts).toHaveBeenCalledTimes(1);
    });

    it("calls only onRefresh when not on board tab", async () => {
      const config = { ...mockConfig, currentTab: "matches" };
      const { result } = renderHook(() => useDetailPageHandlers(config));

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockConfig.onRefresh).toHaveBeenCalledTimes(1);
      expect(mockConfig.refetchPosts).not.toHaveBeenCalled();
    });

    it("resets refreshing state even when refresh fails", async () => {
      mockConfig.onRefresh.mockRejectedValue(new Error("Refresh failed"));
      const { result } = renderHook(() => useDetailPageHandlers(mockConfig));

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(result.current.refreshing).toBe(false);
    });

    it("updates when currentTab changes", async () => {
      const { result, rerender } = renderHook(
        ({ currentTab }: { currentTab: string }) =>
          useDetailPageHandlers({ ...mockConfig, currentTab }),
        { initialProps: { currentTab: "board" } as { currentTab: string } },
      );

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockConfig.refetchPosts).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();
      rerender({ currentTab: "overview" });

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockConfig.refetchPosts).not.toHaveBeenCalled();
    });
  });

  describe("entity-specific logging", () => {
    it("uses League entity name in logging", () => {
      const config = { ...mockConfig, entityName: "League" };
      renderHook(() => useDetailPageHandlers(config));

      // Logger instance is created with entity name
      expect(logger.createScopedLog).toHaveBeenCalledWith("League Detail Page");
    });

    it("uses Team entity name in logging", () => {
      const config = { ...mockConfig, entityName: "Team" };
      renderHook(() => useDetailPageHandlers(config));

      expect(logger.createScopedLog).toHaveBeenCalledWith("Team Detail Page");
    });
  });

  describe("Delete post Cancel button", () => {
    it("logs cancel action when Cancel button is pressed", () => {
      const { result } = renderHook(() => useDetailPageHandlers(mockConfig));
      const mockLog = (logger.createScopedLog as jest.Mock).mock.results[0]
        .value.info as jest.Mock;

      act(() => {
        result.current.handleDeletePost("post-456");
      });

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelButton = alertCall[2].find(
        (btn: { text: string; onPress?: () => void }) => btn.text === "Cancel",
      );

      act(() => {
        cancelButton.onPress();
      });

      expect(mockLog).toHaveBeenCalledWith("Delete post cancelled", {
        postId: "post-456",
      });
    });
  });

  describe("handleRefresh - different tabs", () => {
    it("calls refetchOverview when on overview tab", async () => {
      const refetchOverview = jest.fn().mockResolvedValue(undefined);
      const config = {
        ...mockConfig,
        currentTab: "overview",
        refetchOverview,
      };
      const { result } = renderHook(() => useDetailPageHandlers(config));

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockConfig.onRefresh).toHaveBeenCalledTimes(1);
      expect(refetchOverview).toHaveBeenCalledTimes(1);
    });

    it("calls refetchStandings when on standings tab", async () => {
      const refetchStandings = jest.fn().mockResolvedValue(undefined);
      const config = {
        ...mockConfig,
        currentTab: "standings",
        refetchStandings,
      };
      const { result } = renderHook(() => useDetailPageHandlers(config));

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockConfig.onRefresh).toHaveBeenCalledTimes(1);
      expect(refetchStandings).toHaveBeenCalledTimes(1);
    });

    it("calls onMatchesRefresh when on matches tab", async () => {
      const onMatchesRefresh = jest.fn().mockResolvedValue(undefined);
      const config = {
        ...mockConfig,
        currentTab: "matches",
        onMatchesRefresh,
      };
      const { result } = renderHook(() => useDetailPageHandlers(config));

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockConfig.onRefresh).toHaveBeenCalledTimes(1);
      expect(onMatchesRefresh).toHaveBeenCalledTimes(1);
    });

    it("handles refresh when overview refetch is not provided", async () => {
      const config = {
        ...mockConfig,
        currentTab: "overview",
        refetchOverview: undefined,
      };
      const { result } = renderHook(() => useDetailPageHandlers(config));

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockConfig.onRefresh).toHaveBeenCalledTimes(1);
      expect(result.current.refreshing).toBe(false);
    });

    it("handles refresh when standings refetch is not provided", async () => {
      const config = {
        ...mockConfig,
        currentTab: "standings",
        refetchStandings: undefined,
      };
      const { result } = renderHook(() => useDetailPageHandlers(config));

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockConfig.onRefresh).toHaveBeenCalledTimes(1);
      expect(result.current.refreshing).toBe(false);
    });

    it("handles refresh when onMatchesRefresh is not provided", async () => {
      const config = {
        ...mockConfig,
        currentTab: "matches",
        onMatchesRefresh: undefined,
      };
      const { result } = renderHook(() => useDetailPageHandlers(config));

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockConfig.onRefresh).toHaveBeenCalledTimes(1);
      expect(result.current.refreshing).toBe(false);
    });

    it("falls through to generic refresh for unknown tab", async () => {
      const config = {
        ...mockConfig,
        currentTab: "unknown",
      };
      const { result } = renderHook(() => useDetailPageHandlers(config));

      await act(async () => {
        await result.current.handleRefresh();
      });

      expect(mockConfig.onRefresh).toHaveBeenCalledTimes(1);
      expect(result.current.refreshing).toBe(false);
    });
  });
});
