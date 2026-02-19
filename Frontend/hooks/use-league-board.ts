import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createScopedLog } from "@/utils/logger";
import {
  BoardPost,
  CreateBoardPostRequest,
} from "@/components/board/board-types";
import {
  useAxiosWithClerk,
  GO_LEAGUE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { fetchUserNameMap, mapToFrontendPost } from "@/components/board/board-utils";

const log = createScopedLog("League Board");

const LEAGUE_BOARD_QUERY_KEY = (leagueId: string) => ["league-board", leagueId];

type LeaguePostResponse = {
  id: string;
  leagueId: string;
  authorUserId: string;
  title: string;
  body: string;
  scope: "Members" | "Everyone";
  createdAt: string;
};

type LeaguePostListResponse = {
  items: LeaguePostResponse[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

export function useLeagueBoardPosts(leagueId: string) {
  const api = useAxiosWithClerk();

  return useQuery<BoardPost[]>({
    queryKey: LEAGUE_BOARD_QUERY_KEY(leagueId),
    queryFn: async () => {
      log.info("Fetching league board posts", { leagueId });
      try {
        const response = await api.get<LeaguePostListResponse>(
          GO_LEAGUE_SERVICE_ROUTES.LEAGUE_POSTS(leagueId),
          {
            params: {
              page: 0,
              size: 50,
            },
          }
        );

        const uniqueAuthorIds = [
          ...new Set(response.data.items.map((post) => post.authorUserId)),
        ];

        const userNameMap = await fetchUserNameMap(api, uniqueAuthorIds, log);

        const posts = response.data.items.map((post) =>
          mapToFrontendPost(post, userNameMap)
        );

        log.info("Fetched league board posts with author names", {
          leagueId,
          postCount: posts.length,
          authorCount: uniqueAuthorIds.length,
        });
        return posts;
      } catch (err) {
        log.error("Failed to fetch board posts", { leagueId, error: err });
        throw err;
      }
    },
    enabled: Boolean(leagueId),
    retry: false,
  });
}

export function useCreateLeagueBoardPost(leagueId: string) {
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBoardPostRequest) => {
      log.info("Creating league board post", {
        leagueId,
        title: payload.title,
        scope: payload.scope,
      });

      await api.post<LeaguePostResponse>(
        GO_LEAGUE_SERVICE_ROUTES.LEAGUE_POSTS(leagueId),
        {
          title: payload.title,
          leagueId,
          body: payload.body,
          scope: payload.scope,
        }
      );

      log.info("Created league board post", {
        leagueId,
        title: payload.title,
        scope: payload.scope,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: LEAGUE_BOARD_QUERY_KEY(leagueId),
      });
    },
    onError: (err) => {
      log.error("Failed to create board post:", err);
    },
  });
}

export function useDeleteLeagueBoardPost(leagueId: string) {
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      log.info("Deleting league post", { leagueId, postId });
      await api.delete(
        GO_LEAGUE_SERVICE_ROUTES.LEAGUE_POST(leagueId, postId),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: LEAGUE_BOARD_QUERY_KEY(leagueId),
      });
    },
    onError: (err, postId) => {
      log.error("Failed to delete board post", { postId, leagueId, error: err });
    },
  });
}