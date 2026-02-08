import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createScopedLog } from "@/utils/logger";
import * as Crypto from "expo-crypto";
import {
  BoardPost,
  CreateBoardPostRequest,
} from "@/components/board/board-types";

const log = createScopedLog("Team Board");

const BOARD_QUERY_KEY = (teamId: string) => ["team-board", teamId];

// This file contains mock implementations to unblock frontend development.
// Replace these mock functions with actual API calls when backend is ready.
//
// ENDPOINTS:
//
// 1. GET /api/v1/teams/{teamId}/board
//    - Fetch all board posts for a team
//    - Response: BoardPost[]
//    - Sort: createdAt DESC (newest first)
//
// 2. POST /api/v1/teams/{teamId}/board
//    - Create a new board post
//    - Request body: { title: string, scope: BoardPostScope, body: string }
//    - Response: BoardPost
//    - Authorization: User must have role OWNER (??), MANAGER, or COACH
//    - Validation:
//      * title: required, max 100 characters
//      * body: required, max 1000 characters
//      * scope: one of "Members" | "Everyone"
//    - Auto-populate: authorId, authorName from authenticated user
//
// 3. DELETE /api/v1/teams/{teamId}/board/{postId}
//    - Delete a board post
//    - Authorization: User must be the post author OR have role OWNER/MANAGER (??)
//
// TYPES:
// - BoardPostScope = "Members" | "Everyone"
//   * "Members" - visible only to team members
//   * "Everyone" - visible to everyone
//
// NOTES:
// - All timestamps should be ISO 8601 format (e.g., "2026-02-03T15:30:00Z")
// - authorName should be formatted as "FirstName LastName"

const mockBoardStore: Record<string, BoardPost[]> = {};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createMockPost = (payload: CreateBoardPostRequest): BoardPost => {
  const now = new Date().toISOString();
  return {
    id: `post_${Crypto.randomUUID()}`,
    authorName: "Author Name",
    title: payload.title,
    scope: payload.scope,
    body: payload.body,
    createdAt: now,
  };
};

const getMockPosts = async (teamId: string) => {
  await sleep(250);
  return mockBoardStore[teamId] ?? [];
};

const createMockPostForTeam = async (payload: CreateBoardPostRequest) => {
  await sleep(300);
  const post = createMockPost(payload);
  const current = mockBoardStore[payload.spaceId] ?? [];
  mockBoardStore[payload.spaceId] = [post, ...current];
  return post;
};

const deleteMockPostForTeam = async (teamId: string, postId: string) => {
  await sleep(200);
  const current = mockBoardStore[teamId] ?? [];
  mockBoardStore[teamId] = current.filter((post) => post.id !== postId);
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

export function useCreateBoardPost(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBoardPostRequest) => {
      return await createMockPostForTeam({ ...payload, spaceId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: BOARD_QUERY_KEY(spaceId),
      });
    },
    onError: (err) => {
      log.error("Failed to create board post:", err);
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
