import { fetchUserNameMap, mapToFrontendPost } from "@/components/board/board-utils";

jest.mock("@/hooks/use-axios-clerk", () => ({
  GO_USER_SERVICE_ROUTES: {
    BY_ID: (userId: string) => `/api/v1/user/id/${userId}`,
  },
}));

describe("board-utils", () => {
  describe("fetchUserNameMap", () => {
    it("returns full names, email fallback, and Unknown User on errors", async () => {
      const api = {
        get: jest.fn((url: string) => {
          if (url.endsWith("/user-1")) {
            return Promise.resolve({
              data: { firstname: "Alice", lastname: "Smith", email: "a@x.com" },
            });
          }
          if (url.endsWith("/user-2")) {
            return Promise.resolve({
              data: { firstname: "", lastname: "", email: "b@x.com" },
            });
          }
          if (url.endsWith("/user-3")) {
            return Promise.reject(new Error("No user"));
          }
          if (url.endsWith("/user-4")) {
            return Promise.resolve({
              data: { firstname: "", lastname: "", email: undefined },
            });
          }
          if (url.endsWith("/user-5")) {
            return Promise.resolve({ data: null });
          }
          return Promise.reject(new Error("Unknown URL"));
        }),
      } as any;

      const log = { error: jest.fn() };

      const result = await fetchUserNameMap(
        api,
        ["user-1", "user-2", "user-3", "user-4", "user-5"],
        log,
      );

      expect(result).toEqual({
        "user-1": "Alice Smith",
        "user-2": "b@x.com",
        "user-3": "Unknown User",
        "user-4": "Unknown User",
        "user-5": "Unknown User",
      });
      expect(log.error).toHaveBeenCalledWith(
        "Failed to fetch user info",
        expect.objectContaining({ userId: "user-3" }),
      );
    });
  });

  describe("mapToFrontendPost", () => {
    it("maps a backend post and falls back to Unknown User", () => {
      const backendPost = {
        id: "post-1",
        authorUserId: "user-1",
        title: "Post",
        body: "Body",
        scope: "Members" as const,
        createdAt: "2026-02-08T10:00:00Z",
      };

      const result = mapToFrontendPost(backendPost, {});

      expect(result).toEqual({
        id: "post-1",
        authorName: "Unknown User",
        title: "Post",
        scope: "Members",
        body: "Body",
        createdAt: "2026-02-08T10:00:00Z",
      });
    });
  });
});
