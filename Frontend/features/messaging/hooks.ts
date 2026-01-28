import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { useAuth } from "@clerk/clerk-expo";
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
  const { userId } = useAuth();
  return useQuery<ConversationResponse[]>({
    queryKey: messagingKeys.conversations(userId),
    queryFn: () => fetchConversations(api),
    staleTime: 15_000,
    select: (data) => sortConversations(data ?? []),
    enabled: Boolean(userId),
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
  const { userId } = useAuth();
  return useQuery<UserDirectoryEntry[]>({
    queryKey: messagingKeys.userDirectory(userId),
    queryFn: () => fetchUserDirectory(api),
    staleTime: 60_000,
    enabled: Boolean(userId),
  });
}

export function useMyTeams() {
  const api = useAxiosWithClerk();
  const { userId } = useAuth();
  return useQuery<TeamSummaryResponse[]>({
    queryKey: messagingKeys.myTeams(userId),
    queryFn: () => fetchMyTeams(api),
    staleTime: 60_000,
    enabled: Boolean(userId),
  });
}
