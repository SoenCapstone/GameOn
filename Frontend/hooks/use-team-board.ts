import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createScopedLog } from "@/utils/logger";
import { AxiosInstance } from "axios";
import {
  BoardPost,
  CreateBoardPostRequest,
} from "@/components/board/board-types";
import {
  useAxiosWithClerk,
  GO_USER_SERVICE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";

const log = createScopedLog("Team Board");

const BOARD_QUERY_KEY = (teamId: string) => ["team-board", teamId];

type TeamPostResponse = {
  id: string;
  teamId: string;
  authorUserId: string;
  authorRole: string;
  title: string;
  body: string;
  scope: "Members" | "Everyone";
  createdAt: string;
};

type TeamPostListResponse = {
  posts: TeamPostResponse[];
  totalElements: number;
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
};

async function fetchUserNameMap(
  api: AxiosInstance,
  userIds: string[],
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    userIds.map(async (userId) => {
      try {
        const resp = await api.get(GO_USER_SERVICE_ROUTES.BY_ID(userId));
        const first = resp.data?.firstname ?? "";
        const last = resp.data?.lastname ?? "";
        const full = `${first} ${last}`.trim();
        return [userId, full || resp.data?.email || "Unknown User"] as const;
      } catch (err) {
        log.error("Failed to fetch user info", { userId, error: err });
        return [userId, "Unknown User"] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

const mapToFrontendPost = (
  backendPost: TeamPostResponse,
  userNameMap: Record<string, string>,
): BoardPost => ({
  id: backendPost.id,
  authorName: userNameMap[backendPost.authorUserId] || "Unknown User",
  title: backendPost.title,
  scope: backendPost.scope,
  body: backendPost.body,
  createdAt: backendPost.createdAt,
});

export function useTeamBoardPosts(teamId: string) {
  const api = useAxiosWithClerk();

  return useQuery<BoardPost[]>({
    queryKey: BOARD_QUERY_KEY(teamId),
    queryFn: async () => {
      log.info("Fetching board posts", { teamId });
      try {
        const response = await api.get<TeamPostListResponse>(
          GO_TEAM_SERVICE_ROUTES.TEAM_POSTS(teamId),
          {
            params: {
              page: 0,
              size: 50,
            },
          }
        );

        const uniqueAuthorIds = [
          ...new Set(response.data.posts.map((post) => post.authorUserId)),
        ];

        const userNameMap = await fetchUserNameMap(api, uniqueAuthorIds);

        const posts = response.data.posts.map((post) =>
          mapToFrontendPost(post, userNameMap)
        );

        log.info("Fetched board posts with author names", {
          teamId,
          postCount: posts.length,
          authorCount: uniqueAuthorIds.length,
        });
        return posts;
      } catch (err) {
        log.error("Failed to fetch board posts", { teamId, error: err });
        throw err;
      }
    },
    enabled: Boolean(teamId),
    retry: false,
  });
}

export function useCreateBoardPost(teamId: string) {
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBoardPostRequest) => {
      log.info("Creating board post", {
        teamId,
        title: payload.title,
        scope: payload.scope,
      });

      await api.post<TeamPostResponse>(
        GO_TEAM_SERVICE_ROUTES.TEAM_POSTS(teamId),
        {
          title: payload.title,
          teamId: teamId,
          body: payload.body,
          scope: payload.scope,
        }
      );

      log.info("Created board post", {
        teamId,
        title: payload.title,
        scope: payload.scope,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: BOARD_QUERY_KEY(teamId),
      });
    },
    onError: (err) => {
      log.error("Failed to create board post:", err);
    },
  });
}

export function useDeleteBoardPost(teamId: string) {
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      log.info("Deleting board post", { postId, teamId });
      await api.delete(GO_TEAM_SERVICE_ROUTES.DELETE_TEAM_POST(teamId, postId));
      log.info("Deleted board post", { postId, teamId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: BOARD_QUERY_KEY(teamId),
      });
    },
    onError: (err, postId) => {
      log.error("Failed to delete board post", { postId, teamId, error: err });
    },
  });
}
