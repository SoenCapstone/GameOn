import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { MessagingSocket, SocketState } from "@/features/messaging/socket";
import {
  createDirectConversation,
  createTeamConversation,
  sendMessageFallback,
} from "@/features/messaging/api";
import { messagingKeys } from "@/features/messaging/query-keys";
import {
  ConversationResponse,
  DirectConversationPayload,
  MessageResponse,
  TeamConversationPayload,
  MessageHistoryResponse,
} from "@/features/messaging/types";
import {
  appendMessageToPages,
  sortConversations,
  updateConversationsWithMessage,
  validateMessageContent,
} from "@/features/messaging/utils";
import { createScopedLog } from "@/utils/logger";
import { useConversationsQuery } from "@/features/messaging/hooks";

const log = createScopedLog("MessagingProvider");

interface MessagingContextValue {
  socketState: SocketState;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  startDirectConversation: (
    payload: DirectConversationPayload,
  ) => Promise<ConversationResponse>;
  startTeamConversation: (
    teamId: string,
    payload: TeamConversationPayload,
  ) => Promise<ConversationResponse>;
  ensureTopicSubscription: (conversationId: string) => void;
  reconnect: () => void;
}

const MessagingContext = createContext<MessagingContextValue | null>(null);

export const MessagingProvider = ({ children }: PropsWithChildren) => {
  const api = useAxiosWithClerk();
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const getTokenRef = useRef(getToken);
  const { data: conversations } = useConversationsQuery();
  const [socketState, setSocketState] = useState<SocketState>("idle");
  const socketRef = useRef<MessagingSocket | null>(null);

  const waitForActiveSocket = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket) {
      throw new Error("WebSocket unavailable");
    }
    if (socket.currentState === "error") {
      socket.disconnect();
    }
    if (socket.currentState === "idle") {
      await socket.connect();
    }
    const start = Date.now();
    while (Date.now() - start < 5000) {
      if (socket.currentState === "connected") {
        return;
      }
      if (socket.currentState === "error") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error("WebSocket not connected");
  }, []);

  const handleIncoming = useCallback(
    (message: MessageResponse) => {
      queryClient.setQueryData(
        messagingKeys.messages(message.conversationId),
        (existing: InfiniteData<MessageHistoryResponse> | undefined) => appendMessageToPages(existing, message),
      );
      queryClient.setQueryData(
        messagingKeys.conversations(userId),
        (existing: ConversationResponse[] | undefined) =>
          updateConversationsWithMessage(existing, message),
      );
    },
    [queryClient, userId],
  );

  useEffect(() => {
    const socket = new MessagingSocket({
      getToken: () => getTokenRef.current(),
      onMessage: handleIncoming,
      onStateChange: setSocketState,
    });
    socketRef.current = socket;
    return () => socket.disconnect();
  }, [handleIncoming]);

  useEffect(() => {
    if (!userId) {
      socketRef.current?.disconnect();
      return;
    }
    socketRef.current
      ?.connect()
      .catch((err) => log.error("Socket connect failed", err));
  }, [userId]);

  const ensureTopicSubscription = useCallback((conversationId: string) => {
    socketRef.current?.ensureConversationSubscription(conversationId);
  }, []);

  useEffect(() => {
    const conversationIds = (conversations ?? [])
      .filter((c) => c.type === "GROUP")
      .map((c) => c.id);
    socketRef.current?.syncConversationSubscriptions(conversationIds);
  }, [conversations]);

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      const validation = validateMessageContent(content);
      if (!validation.valid) {
        throw new Error(validation.reason);
      }
      try {
        await waitForActiveSocket();
        await socketRef.current?.sendMessage({
          conversationId,
          content: validation.value,
        });
      } catch (err) {
        log.warn("WebSocket send failed, falling back to REST", err);
        const fallback = await sendMessageFallback(api, {
          conversationId,
          content: validation.value,
        });
        handleIncoming(fallback);
      }
    },
    [api, handleIncoming, waitForActiveSocket],
  );

  const upsertConversation = useCallback(
    (response: ConversationResponse) => {
      queryClient.setQueryData(
        messagingKeys.conversations(userId),
        (existing: ConversationResponse[] | undefined) => {
          const filtered = (existing ?? []).filter((c) => c.id !== response.id);
          return sortConversations([...filtered, response]);
        },
      );
      if (response.type === "GROUP") {
        ensureTopicSubscription(response.id);
      }
    },
    [ensureTopicSubscription, queryClient, userId],
  );

  const startDirectConversation = useCallback(
    async (payload: DirectConversationPayload) => {
      const response = await createDirectConversation(api, payload);
      upsertConversation(response);
      return response;
    },
    [api, upsertConversation],
  );

  const startTeamConversation = useCallback(
    async (teamId: string, payload: TeamConversationPayload) => {
      const response = await createTeamConversation(api, teamId, payload);
      upsertConversation(response);
      return response;
    },
    [api, upsertConversation],
  );

  const reconnect = useCallback(() => {
    if (!userId) {
      socketRef.current?.disconnect();
      return;
    }
    socketRef.current?.disconnect();
    socketRef.current?.connect().catch((err) =>
      log.error("Reconnection failed", err),
    );
  }, [userId]);

  const value = useMemo<MessagingContextValue>(
    () => ({
      socketState,
      sendMessage,
      startDirectConversation,
      startTeamConversation,
      ensureTopicSubscription,
      reconnect,
    }),
    [ensureTopicSubscription, reconnect, sendMessage, socketState, startDirectConversation, startTeamConversation],
  );

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessagingContext = () => {
  const ctx = useContext(MessagingContext);
  if (!ctx) {
    throw new Error("useMessagingContext must be used within MessagingProvider");
  }
  return ctx;
};
