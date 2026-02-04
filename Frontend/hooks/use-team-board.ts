import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createScopedLog } from "@/utils/logger";
import * as Crypto from "expo-crypto";
import {
  BoardPost,
  BoardPostScope,
  BoardPostType,
  CreateBoardPostRequest,
} from "@/components/teams/board/team-board-types";

const log = createScopedLog("Team Board");

const BOARD_QUERY_KEY = (teamId: string) => ["team-board", teamId];

// This file contains mock implementations to unblock frontend development.
// Replace these mock functions with actual API calls when backend is ready.
//
// ENDPOINTS:
//
// 1. GET /api/v1/teams/{teamId}/board
//    - Fetch all board posts for a team
//    - Query params (optional):
//      * limit: number (default: 50)
//      * offset: number (default: 0)
//    - Response: BoardPost[]
//    - Authorization: User must be a team member OR post.scope === "everyone"
//    - Sort: createdAt DESC (newest first)
//
// 2. POST /api/v1/teams/{teamId}/board
//    - Create a new board post
//    - Request body: { type: BoardPostType, scope: BoardPostScope, content: string }
//    - Response: BoardPost
//    - Authorization: User must have role OWNER, MANAGER, or COACH
//    - Validation:
//      * content: required, max 1000 characters
//      * type: one of "general" | "game" | "training" | "other"
//      * scope: one of "players" | "everyone"
//    - Auto-populate: authorId, authorName from authenticated user
//
// 3. PUT /api/v1/teams/{teamId}/board/{postId}
//    - Update an existing board post
//    - Request body: { type: BoardPostType, scope: BoardPostScope, content: string }
//    - Response: BoardPost
//    - Authorization: User must be the post author OR have role OWNER/MANAGER
//    - Validation: same as POST
//    - Update: updatedAt timestamp
//
// 4. DELETE /api/v1/teams/{teamId}/board/{postId}
//    - Delete a board post
//    - Response: 204 No Content
//    - Authorization: User must be the post author OR have role OWNER/MANAGER
//
// TYPES:
// - BoardPostType = "general" | "game" | "training" | "other"
// - BoardPostScope = "players" | "everyone"
//   * "players" - visible only to team members (role: OWNER, MANAGER, COACH, PLAYER)
//   * "everyone" - visible to everyone (including followers)
//
// ERROR RESPONSES:
// - 400: Invalid request body or validation error
// - 401: Unauthorized (not authenticated)
// - 403: Forbidden (authenticated but lacks permission)
// - 404: Team or post not found
// - 500: Internal server error
//
// NOTES:
// - All timestamps should be ISO 8601 format (e.g., "2026-02-03T15:30:00Z")
// - authorName should be formatted as "FirstName LastName"
// - Consider implementing pagination for large teams
// - Consider adding websocket support for real-time updates
//
// ==============================================================================

const mockBoardStore: Record<string, BoardPost[]> = {};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createMockPost = (payload: CreateBoardPostRequest): BoardPost => {
  const now = new Date().toISOString();
  return {
    id: `post_${Crypto.randomUUID()}`,
    teamId: payload.teamId,
    authorId: "mock-coach-id",
    authorName: "Coach",
    authorImage: null,
    type: payload.type,
    scope: payload.scope,
    content: payload.content,
    createdAt: now,
    updatedAt: now,
  };
};

const getMockPosts = async (teamId: string) => {
  await sleep(250);
  return mockBoardStore[teamId] ?? [];
};

const createMockPostForTeam = async (payload: CreateBoardPostRequest) => {
  await sleep(300);
  const post = createMockPost(payload);
  const current = mockBoardStore[payload.teamId] ?? [];
  mockBoardStore[payload.teamId] = [post, ...current];
  return post;
};

const deleteMockPostForTeam = async (teamId: string, postId: string) => {
  await sleep(200);
  const current = mockBoardStore[teamId] ?? [];
  mockBoardStore[teamId] = current.filter((post) => post.id !== postId);
};

const updateMockPostForTeam = async (
  teamId: string,
  postId: string,
  updates: { type: BoardPostType; scope: BoardPostScope; content: string },
) => {
  await sleep(300);
  const current = mockBoardStore[teamId] ?? [];
  const postIndex = current.findIndex((p) => p.id === postId);
  if (postIndex !== -1) {
    mockBoardStore[teamId][postIndex] = {
      ...current[postIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return mockBoardStore[teamId][postIndex];
  }
  throw new Error("Post not found");
};

export function useTeamBoardPosts(teamId: string) {
  return useQuery<BoardPost[]>({
    queryKey: BOARD_QUERY_KEY(teamId),
    queryFn: async () => {
      try {
        return await getMockPosts(teamId);
      } catch (err) {
        log.error("Failed to fetch board posts:", err);
        throw err;
      }
    },
    enabled: Boolean(teamId),
    staleTime: 300000,
  });
}

export function useCreateBoardPost(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBoardPostRequest) => {
      return await createMockPostForTeam({ ...payload, teamId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: BOARD_QUERY_KEY(teamId),
      });
    },
    onError: (err) => {
      log.error("Failed to create board post:", err);
      throw err;
    },
  });
}

export function useUpdateBoardPost(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      type,
      scope,
      content,
    }: {
      postId: string;
      type: BoardPostType;
      scope: BoardPostScope;
      content: string;
    }) => {
      return await updateMockPostForTeam(teamId, postId, {
        type,
        scope,
        content,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: BOARD_QUERY_KEY(teamId),
      });
    },
    onError: (err) => {
      log.error("Failed to update board post:", err);
      throw err;
    },
  });
}

export function useDeleteBoardPost(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      await deleteMockPostForTeam(teamId, postId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: BOARD_QUERY_KEY(teamId),
      });
    },
    onError: (err) => {
      log.error("Failed to delete board post:", err);
      throw err;
    },
  });
}
