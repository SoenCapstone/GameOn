import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchConversations,
  fetchMessages,
  fetchMyTeams,
  fetchUserDirectory,
  TeamSummaryResponse,
  UserDirectoryEntry,
} from "./api";
import { messagingKeys } from "./query-keys";
import { ConversationResponse, MessageHistoryResponse } from "./types";
import { sortConversations } from "./utils";

export const MESSAGES_PAGE_SIZE = 40;

export function useConversationsQuery() {
  const api = useAxiosWithClerk();
  return useQuery<ConversationResponse[]>({
    queryKey: messagingKeys.conversations(),
    queryFn: () => fetchConversations(api),
    staleTime: 15_000,
    select: (data) => sortConversations(data ?? []),
  });
}

export function useMessagesQuery(conversationId: string) {
  const api = useAxiosWithClerk();
  return useInfiniteQuery<MessageHistoryResponse>({
    queryKey: messagingKeys.messages(conversationId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchMessages(api, {
        conversationId,
        limit: MESSAGES_PAGE_SIZE,
        before: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore || !lastPage.messages.length) return undefined;
      return lastPage.messages[0].createdAt;
    },
    enabled: Boolean(conversationId),
  });
}

export function useUserDirectory() {
  const api = useAxiosWithClerk();
  return useQuery<UserDirectoryEntry[]>({
    queryKey: messagingKeys.userDirectory(),
    queryFn: () => fetchUserDirectory(api),
    staleTime: 60_000,
  });
}

export function useMyTeams() {
  const api = useAxiosWithClerk();
  return useQuery<TeamSummaryResponse[]>({
    queryKey: messagingKeys.myTeams(),
    queryFn: () => fetchMyTeams(api),
    staleTime: 60_000,
  });
}
