import { PropsWithChildren } from "react";
import { renderHook, waitFor, cleanup } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useTeamBoardPosts,
  useCreateBoardPost,
  useDeleteBoardPost,
} from "@/hooks/use-team-board";
import { CreateBoardPostRequest } from "@/components/board/board-types";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: jest.fn(),
  GO_TEAM_SERVICE_ROUTES: {
    TEAM_POSTS: (teamId: string) => `/api/v1/teams/${teamId}/posts`,
    DELETE_TEAM_POST: (teamId: string, postId: string) =>
      `/api/v1/teams/${teamId}/posts/${postId}`,
  },
  GO_USER_SERVICE_ROUTES: {
    BY_ID: (userId: string) => `/api/v1/user/id/${userId}`,
  },
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

describe("use-team-board", () => {
  const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAxiosWithClerk.mockReturnValue(mockApi as any);

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

  describe("useTeamBoardPosts", () => {
    it("fetches posts successfully for a team", async () => {
      const teamId = "team-123";

      mockApi.get.mockImplementation((url: string) => {
        if (url.includes("/posts")) {
          return Promise.resolve({
            data: {
              posts: [
                {
                  id: "post-1",
                  teamId: "team-123",
                  authorUserId: "user-1",
                  authorRole: "MANAGER",
                  title: "Test Post",
                  body: "Test body",
                  scope: "Members",
                  createdAt: "2026-02-08T10:00:00Z",
                },
              ],
              totalElements: 1,
              pageNumber: 0,
              pageSize: 50,
              hasNext: false,
            },
          });
        }
        if (url.includes("/user/id/")) {
          return Promise.resolve({
            data: {
              id: "user-1",
              firstname: "John",
              lastname: "Doe",
              email: "john@example.com",
            },
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      const { result } = renderHook(() => useTeamBoardPosts(teamId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0]).toMatchObject({
        id: "post-1",
        authorName: "John Doe",
        title: "Test Post",
        body: "Test body",
        scope: "Members",
      });
      expect(result.current.isLoading).toBe(false);
    });

    it("returns empty array for team with no posts", async () => {
      const teamId = "team-empty";

      mockApi.get.mockResolvedValue({
        data: {
          posts: [],
          totalElements: 0,
          pageNumber: 0,
          pageSize: 50,
          hasNext: false,
        },
      });

      const { result } = renderHook(() => useTeamBoardPosts(teamId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("disables query when teamId is empty", () => {
      const { result } = renderHook(() => useTeamBoardPosts(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it("handles fetch errors gracefully", async () => {
      const teamId = "team-error-fetch";
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockApi.get.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTeamBoardPosts(teamId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();

      errorSpy.mockRestore();
    });

    it("uses email when user has no firstname/lastname", async () => {
      const teamId = "team-email-fallback";

      mockApi.get.mockImplementation((url: string) => {
        if (url.includes("/posts")) {
          return Promise.resolve({
            data: {
              posts: [
                {
                  id: "post-1",
                  teamId: "team-email-fallback",
                  authorUserId: "user-no-name",
                  authorRole: "MEMBER",
                  title: "Test Post",
                  body: "Test body",
                  scope: "Members",
                  createdAt: "2026-02-08T10:00:00Z",
                },
              ],
              totalElements: 1,
              pageNumber: 0,
              pageSize: 50,
              hasNext: false,
            },
          });
        }
        if (url.includes("/user/id/")) {
          return Promise.resolve({
            data: {
              id: "user-no-name",
              firstname: "",
              lastname: "",
              email: "user@example.com",
            },
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      const { result } = renderHook(() => useTeamBoardPosts(teamId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0]?.authorName).toBe("user@example.com");
    });

    it("falls back to Unknown User when user fetch fails", async () => {
      const teamId = "team-user-fetch-error";
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockApi.get.mockImplementation((url: string) => {
        if (url.includes("/posts")) {
          return Promise.resolve({
            data: {
              posts: [
                {
                  id: "post-1",
                  teamId: "team-user-fetch-error",
                  authorUserId: "user-error",
                  authorRole: "MEMBER",
                  title: "Test Post",
                  body: "Test body",
                  scope: "Members",
                  createdAt: "2026-02-08T10:00:00Z",
                },
              ],
              totalElements: 1,
              pageNumber: 0,
              pageSize: 50,
              hasNext: false,
            },
          });
        }
        if (url.includes("/user/id/")) {
          return Promise.reject(new Error("User not found"));
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      const { result } = renderHook(() => useTeamBoardPosts(teamId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0]?.authorName).toBe("Unknown User");

      errorSpy.mockRestore();
    });

    it("handles user data with no email", async () => {
      const teamId = "team-no-email";

      mockApi.get.mockImplementation((url: string) => {
        if (url.includes("/posts")) {
          return Promise.resolve({
            data: {
              posts: [
                {
                  id: "post-1",
                  teamId: "team-no-email",
                  authorUserId: "user-no-email",
                  authorRole: "MEMBER",
                  title: "Test Post",
                  body: "Test body",
                  scope: "Members",
                  createdAt: "2026-02-08T10:00:00Z",
                },
              ],
              totalElements: 1,
              pageNumber: 0,
              pageSize: 50,
              hasNext: false,
            },
          });
        }
        if (url.includes("/user/id/")) {
          return Promise.resolve({
            data: {
              id: "user-no-email",
              firstname: "",
              lastname: "",
              email: undefined,
            },
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      const { result } = renderHook(() => useTeamBoardPosts(teamId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0]?.authorName).toBe("Unknown User");
    });

    it("handles null response data from user service", async () => {
      const teamId = "team-null-data";

      mockApi.get.mockImplementation((url: string) => {
        if (url.includes("/posts")) {
          return Promise.resolve({
            data: {
              posts: [
                {
                  id: "post-1",
                  teamId: "team-null-data",
                  authorUserId: "user-null-data",
                  authorRole: "MEMBER",
                  title: "Test Post",
                  body: "Test body",
                  scope: "Members",
                  createdAt: "2026-02-08T10:00:00Z",
                },
              ],
              totalElements: 1,
              pageNumber: 0,
              pageSize: 50,
              hasNext: false,
            },
          });
        }
        if (url.includes("/user/id/")) {
          return Promise.resolve({
            data: null,
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      const { result } = renderHook(() => useTeamBoardPosts(teamId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0]?.authorName).toBe("Unknown User");
    });

    it("uses Unknown User fallback when userNameMap has empty string", async () => {
      const teamId = "team-empty-name";

      mockApi.get.mockImplementation((url: string) => {
        if (url.includes("/posts")) {
          return Promise.resolve({
            data: {
              posts: [
                {
                  id: "post-1",
                  teamId: "team-empty-name",
                  authorUserId: "user-empty",
                  authorRole: "MEMBER",
                  title: "Test Post",
                  body: "Test body",
                  scope: "Members",
                  createdAt: "2026-02-08T10:00:00Z",
                },
              ],
              totalElements: 1,
              pageNumber: 0,
              pageSize: 50,
              hasNext: false,
            },
          });
        }
        if (url.includes("/user/id/")) {
          return Promise.resolve({
            data: {
              id: "user-empty",
              firstname: " ",
              lastname: " ",
              email: "",
            },
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      const { result } = renderHook(() => useTeamBoardPosts(teamId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0]?.authorName).toBe("Unknown User");
    });
  });

  describe("useCreateBoardPost", () => {
    it("creates a post successfully", async () => {
      const teamId = "team-create";

      mockApi.post.mockResolvedValue({
        data: {
          id: "post-new",
          teamId: "team-create",
          authorUserId: "user-1",
          authorRole: "MANAGER",
          title: "Test Post",
          body: "Test body content",
          scope: "Members",
          createdAt: "2026-02-08T10:00:00Z",
        },
      });

      const wrapper = createWrapper();

      const { result: createResult } = renderHook(
        () => useCreateBoardPost(teamId),
        { wrapper },
      );

      const payload: CreateBoardPostRequest = {
        spaceId: teamId,
        title: "Test Post",
        scope: "Members",
        body: "Test body content",
      };

      createResult.current.mutate(payload);

      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        `/api/v1/teams/${teamId}/posts`,
        {
          title: "Test Post",
          teamId: teamId,
          body: "Test body content",
          scope: "Members",
        },
      );
    });

    it("creates posts with different scopes", async () => {
      const teamId = "team-scopes";

      mockApi.post.mockResolvedValue({
        data: {
          id: "post-new",
          teamId: "team-scopes",
          authorUserId: "user-1",
          authorRole: "MANAGER",
          title: "Public Post",
          body: "Public content",
          scope: "Everyone",
          createdAt: "2026-02-08T10:00:00Z",
        },
      });

      const wrapper = createWrapper();

      const { result: createResult } = renderHook(
        () => useCreateBoardPost(teamId),
        { wrapper },
      );

      createResult.current.mutate({
        spaceId: teamId,
        title: "Public Post",
        scope: "Everyone",
        body: "Public content",
      });

      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        `/api/v1/teams/${teamId}/posts`,
        expect.objectContaining({
          scope: "Everyone",
        }),
      );
    });

    it("handles creation errors gracefully", async () => {
      const teamId = "team-error-create";
      const wrapper = createWrapper();
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockApi.post.mockRejectedValue(new Error("Creation failed"));

      const { result: createResult } = renderHook(
        () => useCreateBoardPost(teamId),
        { wrapper },
      );

      createResult.current.mutate({
        spaceId: teamId,
        title: "Test",
        scope: "Members",
        body: "Test body",
      });

      await waitFor(() => {
        expect(createResult.current.isError).toBe(true);
      });

      expect(createResult.current.error).toBeTruthy();

      errorSpy.mockRestore();
    });
  });

  describe("useDeleteBoardPost", () => {
    it("deletes a post successfully", async () => {
      const teamId = "team-delete";
      const postId = "post-123";

      mockApi.delete.mockResolvedValue({ data: {} });

      const wrapper = createWrapper();

      const { result } = renderHook(() => useDeleteBoardPost(teamId), {
        wrapper,
      });

      result.current.mutate(postId);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.delete).toHaveBeenCalledWith(
        `/api/v1/teams/${teamId}/posts/${postId}`,
      );
      expect(result.current.status).toBe("success");
    });

    it("handles deletion errors gracefully", async () => {
      const teamId = "team-delete-error";
      const wrapper = createWrapper();
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockApi.delete.mockRejectedValue(new Error("Deletion failed"));

      const { result } = renderHook(() => useDeleteBoardPost(teamId), {
        wrapper,
      });

      result.current.mutate("post-456");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();

      errorSpy.mockRestore();
    });
  });
});
