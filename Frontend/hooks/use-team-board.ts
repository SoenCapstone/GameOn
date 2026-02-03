import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createScopedLog } from "@/utils/logger";
import {
  BoardPost,
  BoardPostScope,
  BoardPostType,
  CreateBoardPostRequest,
} from "@/components/teams/team-board-types";

const log = createScopedLog("Team Board");

const BOARD_QUERY_KEY = (teamId: string) => ["team-board", teamId];

// Mock backend to unblock frontend while API is not ready.
// Intended endpoints for backend engineer:
// - GET    /api/v1/teams/{teamId}/board
// - POST   /api/v1/teams/{teamId}/board
// - DELETE /api/v1/teams/{teamId}/board/{postId}
// Notes:
// - `scope` values: "players" | "everyone"
// - `type` values: "general" | "game" | "training" | "other"
const mockBoardStore: Record<string, BoardPost[]> = {};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createMockPost = (payload: CreateBoardPostRequest): BoardPost => {
  const now = new Date().toISOString();
  return {
    id: `post_${Math.random().toString(36).slice(2, 10)}`,
    teamId: payload.teamId,
    authorId: "mock-coach-id",
    authorName: "Coach",
    authorImage: null,
    type: payload.type as BoardPostType,
    scope: payload.scope as BoardPostScope,
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