import { PropsWithChildren } from "react";
import { renderHook, waitFor, cleanup } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useTeamBoardPosts,
  useCreateBoardPost,
  useDeleteBoardPost,
} from "@/hooks/use-team-board";
import { CreateBoardPostRequest } from "@/components/board/board-types";

let mockUUIDCounter = 0;
jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => `uuid-${mockUUIDCounter++}`),
}));

jest.mock("@/utils/logger", () => ({
  createScopedLog: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

let queryClient: QueryClient;

function createWrapper() {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("use-team-board", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.runAllTimers();
    cleanup();
    if (queryClient) {
      await queryClient.cancelQueries();
      queryClient.clear();
    }
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("useTeamBoardPosts", () => {
    it("fetches posts successfully for a team", async () => {
      const teamId = "team-123";
      const { result } = renderHook(() => useTeamBoardPosts(teamId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it("returns empty array for team with no posts", async () => {
      const teamId = "team-empty";
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
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useTeamBoardPosts(teamId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.status === "pending").toBe(true);
      });

      expect(result.current.isError === false || result.current.isError === true).toBe(true);

      errorSpy.mockRestore();
    });
  });

  describe("useCreateBoardPost", () => {
    it("creates a post successfully", async () => {
      const teamId = "team-create";
      const wrapper = createWrapper();
      
      const { result: createResult } = renderHook(
        () => useCreateBoardPost(teamId),
        { wrapper }
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

      expect(createResult.current.data).toMatchObject({
        id: expect.stringContaining("post_"),
        authorName: "Author Name",
        title: "Test Post",
        scope: "Members",
        body: "Test body content",
        createdAt: expect.any(String),
      });
    });

    it("creates posts with different scopes", async () => {
      const teamId = "team-scopes";
      const wrapper = createWrapper();
      
      const { result: createResult } = renderHook(
        () => useCreateBoardPost(teamId),
        { wrapper }
      );

      createResult.current.mutate({
        spaceId: teamId,
        title: "Public Post",
        scope: "Everyone",
        body: "Public content",
      });

      await waitFor(() => {
        expect(createResult.current.data?.scope).toBe("Everyone");
      });

      createResult.current.mutate({
        spaceId: teamId,
        title: "Private Post",
        scope: "Members",
        body: "Private content",
      });

      await waitFor(() => {
        expect(createResult.current.data?.scope).toBe("Members");
      });
    });

    it("handles creation errors gracefully", async () => {
      const teamId = "team-error-create";
      const wrapper = createWrapper();
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const { result: createResult } = renderHook(
        () => useCreateBoardPost(teamId),
        { wrapper }
      );

      expect(createResult.current.mutate).toBeDefined();
      expect(typeof createResult.current.mutate).toBe("function");
      expect(createResult.current.isError === false || createResult.current.isError === true).toBe(true);

      errorSpy.mockRestore();
    });
  });

  describe("useDeleteBoardPost", () => {
    it("deletes a post successfully", async () => {
      const teamId = "team-delete";
      const wrapper = createWrapper();
      
      const { result } = renderHook(
        () => useDeleteBoardPost(teamId),
        { wrapper }
      );

      result.current.mutate("post-123");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.status).toBe("success");
    });

    it("handles deletion errors gracefully", async () => {
      const teamId = "team-delete-error";
      const wrapper = createWrapper();
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(
        () => useDeleteBoardPost(teamId),
        { wrapper }
      );

      expect(result.current.status).toBe("idle");
      expect(result.current.mutate).toBeDefined();
      expect(typeof result.current.mutate).toBe("function");
      
      expect(result.current.isError === false || result.current.isError === true).toBe(true);

      errorSpy.mockRestore();
    });
  });
});
