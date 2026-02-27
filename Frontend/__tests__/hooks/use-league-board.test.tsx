import { PropsWithChildren } from "react";
import { renderHook, waitFor, cleanup } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useLeagueBoardPosts,
  useCreateLeagueBoardPost,
  useDeleteLeagueBoardPost,
} from "@/hooks/use-league-board";
import { CreateBoardPostRequest } from "@/components/board/board-types";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import {
  fetchUserNameMap,
  mapToFrontendPost,
} from "@/components/board/board-utils";
import { AxiosInstance } from "axios";

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: jest.fn(),
  GO_LEAGUE_SERVICE_ROUTES: {
    LEAGUE_POSTS: (leagueId: string) => `/api/v1/leagues/${leagueId}/posts`,
    LEAGUE_POST: (leagueId: string, postId: string) =>
      `/api/v1/leagues/${leagueId}/posts/${postId}`,
  },
}));

jest.mock("@/components/board/board-utils", () => ({
  fetchUserNameMap: jest.fn(),
  mapToFrontendPost: jest.fn(),
}));

jest.mock("@/utils/logger", () => ({
  createScopedLog: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

const mockedUseAxiosWithClerk = useAxiosWithClerk as jest.MockedFunction<
  typeof useAxiosWithClerk
>;

const mockedFetchUserNameMap = fetchUserNameMap as jest.MockedFunction<
  typeof fetchUserNameMap
>;

const mockedMapToFrontendPost = mapToFrontendPost as jest.MockedFunction<
  typeof mapToFrontendPost
>;

let queryClient: QueryClient;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper() {
  queryClient = createQueryClient();

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("use-league-board", () => {
  const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAxiosWithClerk.mockReturnValue(
      mockApi as unknown as AxiosInstance,
    );

    mockApi.get.mockReset().mockResolvedValue({ data: {} });
    mockApi.post.mockReset().mockResolvedValue({ data: {} });
    mockApi.delete.mockReset().mockResolvedValue({ data: {} });
  });

  afterEach(async () => {
    cleanup();
    if (queryClient) {
      queryClient.cancelQueries();
      queryClient.clear();
      queryClient.removeQueries();
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  describe("useLeagueBoardPosts", () => {
    it("fetches posts and maps author names", async () => {
      const leagueId = "league-123";

      mockApi.get.mockResolvedValue({
        data: {
          items: [
            {
              id: "post-1",
              leagueId,
              authorUserId: "user-1",
              title: "Post One",
              body: "Body One",
              scope: "Members",
              createdAt: "2026-02-08T10:00:00Z",
            },
            {
              id: "post-2",
              leagueId,
              authorUserId: "user-1",
              title: "Post Two",
              body: "Body Two",
              scope: "Everyone",
              createdAt: "2026-02-08T11:00:00Z",
            },
            {
              id: "post-3",
              leagueId,
              authorUserId: "user-2",
              title: "Post Three",
              body: "Body Three",
              scope: "Members",
              createdAt: "2026-02-08T12:00:00Z",
            },
          ],
          total: 3,
          page: 0,
          size: 50,
          hasNext: false,
        },
      });

      const userNameMap: Record<string, string> = {
        "user-1": "Alice",
        "user-2": "Bob",
      };

      mockedFetchUserNameMap.mockResolvedValue(userNameMap);
      mockedMapToFrontendPost.mockImplementation((post) => ({
        id: post.id,
        title: post.title,
        body: post.body,
        scope: post.scope,
        createdAt: post.createdAt,
        authorName: userNameMap[post.authorUserId] ?? "Unknown",
      }));

      const { result } = renderHook(() => useLeagueBoardPosts(leagueId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedFetchUserNameMap).toHaveBeenCalledWith(
        mockApi,
        ["user-1", "user-2"],
        expect.any(Object),
      );
      expect(mockedMapToFrontendPost).toHaveBeenCalledTimes(3);
      expect(result.current.data).toEqual([
        {
          id: "post-1",
          title: "Post One",
          body: "Body One",
          scope: "Members",
          createdAt: "2026-02-08T10:00:00Z",
          authorName: "Alice",
        },
        {
          id: "post-2",
          title: "Post Two",
          body: "Body Two",
          scope: "Everyone",
          createdAt: "2026-02-08T11:00:00Z",
          authorName: "Alice",
        },
        {
          id: "post-3",
          title: "Post Three",
          body: "Body Three",
          scope: "Members",
          createdAt: "2026-02-08T12:00:00Z",
          authorName: "Bob",
        },
      ]);
    });

    it("disables query when leagueId is empty", () => {
      const { result } = renderHook(() => useLeagueBoardPosts(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it("surfaces errors from the API", async () => {
      const leagueId = "league-error";
      mockApi.get.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useLeagueBoardPosts(leagueId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useCreateLeagueBoardPost", () => {
    it("creates a league post and invalidates cache", async () => {
      const leagueId = "league-create";
      const wrapper = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result: createResult } = renderHook(
        () => useCreateLeagueBoardPost(leagueId),
        { wrapper },
      );

      const payload: CreateBoardPostRequest = {
        spaceId: leagueId,
        title: "New Post",
        scope: "Members",
        body: "Post body",
      };

      createResult.current.mutate(payload);

      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        `/api/v1/leagues/${leagueId}/posts`,
        {
          title: "New Post",
          leagueId,
          body: "Post body",
          scope: "Members",
        },
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["league-board", leagueId],
      });
    });

    it("handles creation errors", async () => {
      const leagueId = "league-create-error";
      const wrapper = createWrapper();
      mockApi.post.mockRejectedValue(new Error("Creation failed"));

      const { result: createResult } = renderHook(
        () => useCreateLeagueBoardPost(leagueId),
        { wrapper },
      );

      createResult.current.mutate({
        spaceId: leagueId,
        title: "Test",
        scope: "Members",
        body: "Body",
      });

      await waitFor(() => {
        expect(createResult.current.isError).toBe(true);
      });

      expect(createResult.current.error).toBeTruthy();
    });
  });

  describe("useDeleteLeagueBoardPost", () => {
    it("deletes a league post and invalidates cache", async () => {
      const leagueId = "league-delete";
      const postId = "post-123";
      const wrapper = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteLeagueBoardPost(leagueId), {
        wrapper,
      });

      result.current.mutate(postId);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.delete).toHaveBeenCalledWith(
        `/api/v1/leagues/${leagueId}/posts/${postId}`,
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["league-board", leagueId],
      });
    });

    it("handles deletion errors", async () => {
      const leagueId = "league-delete-error";
      const wrapper = createWrapper();
      mockApi.delete.mockRejectedValue(new Error("Deletion failed"));

      const { result } = renderHook(() => useDeleteLeagueBoardPost(leagueId), {
        wrapper,
      });

      result.current.mutate("post-456");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });
});
