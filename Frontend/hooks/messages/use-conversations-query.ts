import { fetchConversations } from "@/hooks/messages/api";
import {
  messagingKeys,
  type ConversationResponse,
} from "@/constants/messaging";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { sortConversations } from "@/utils/messaging/utils";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

export function useConversationsQuery() {
  const api = useAxiosWithClerk();
  const { userId } = useAuth();

  return useQuery<ConversationResponse[]>({
    queryKey: messagingKeys.conversations(userId),
    queryFn: () => fetchConversations(api),
    staleTime: 15_000,
    refetchOnMount: false,
    select: (data) => sortConversations(data ?? []),
    enabled: Boolean(userId),
  });
}
