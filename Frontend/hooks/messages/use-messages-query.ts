import { fetchMessages } from "@/hooks/messages/api";
import {
  messagingKeys,
  type MessageHistoryResponse,
} from "@/constants/messaging";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { useInfiniteQuery } from "@tanstack/react-query";

export function useMessagesQuery(conversationId: string) {
  const api = useAxiosWithClerk();

  return useInfiniteQuery<MessageHistoryResponse>({
    queryKey: messagingKeys.messages(conversationId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchMessages(api, {
        conversationId,
        limit: 40,
        before: pageParam as string | null,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore || !lastPage.messages.length) return undefined;
      return lastPage.messages[0].createdAt;
    },
    enabled: Boolean(conversationId),
  });
}
