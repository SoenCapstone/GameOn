import { AxiosInstance } from "axios";
import { BoardPost } from "@/components/board/board-types";
import { GO_USER_SERVICE_ROUTES } from "@/hooks/use-axios-clerk";

type LogShape = {
  error: (message: string, meta?: unknown) => void;
};

type BackendBoardPost = {
  id: string;
  authorUserId: string;
  title: string;
  body: string;
  scope: "Members" | "Everyone";
  createdAt: string;
};

export async function fetchUserNameMap(
  api: AxiosInstance,
  userIds: string[],
  log: LogShape,
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

export function mapToFrontendPost(
  backendPost: BackendBoardPost,
  userNameMap: Record<string, string>,
): BoardPost {
  return {
    id: backendPost.id,
    authorName: userNameMap[backendPost.authorUserId] || "Unknown User",
    title: backendPost.title,
    scope: backendPost.scope,
    body: backendPost.body,
    createdAt: backendPost.createdAt,
  };
}
