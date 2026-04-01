import { AxiosInstance } from "axios";
import {
  GO_MESSAGING_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
  GO_USER_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { createScopedLog } from "@/utils/logger";
import type {
  ConversationListResponse,
  ConversationResponse,
  DirectConversationPayload,
  FetchMessagesParams,
  MessageHistoryResponse,
  MessageResponse,
  SendMessagePayload,
  TeamConversationPayload,
  TeamListResponse,
  TeamSummaryResponse,
  UserDirectoryEntry,
} from "@/constants/messaging";

const log = createScopedLog("MessagingAPI");

export async function fetchConversations(
  api: AxiosInstance,
): Promise<ConversationResponse[]> {
  const resp = await api.get<ConversationListResponse>(
    GO_MESSAGING_ROUTES.CONVERSATIONS,
    { timeout: 7000 },
  );
  return resp.data.conversations ?? [];
}

export async function createDirectConversation(
  api: AxiosInstance,
  payload: DirectConversationPayload,
): Promise<ConversationResponse> {
  const resp = await api.post<ConversationResponse>(
    GO_MESSAGING_ROUTES.DIRECT_CONVERSATION,
    payload,
    { timeout: 7000 },
  );
  return resp.data;
}

export async function createTeamConversation(
  api: AxiosInstance,
  teamId: string,
  payload: TeamConversationPayload,
): Promise<ConversationResponse> {
  const resp = await api.post<ConversationResponse>(
    GO_MESSAGING_ROUTES.TEAM_CONVERSATIONS(teamId),
    payload,
    { timeout: 7000 },
  );
  return resp.data;
}

export async function fetchMessages(
  api: AxiosInstance,
  params: FetchMessagesParams,
): Promise<MessageHistoryResponse> {
  const { conversationId, limit, before } = params;
  const query: Record<string, string> = {};
  if (limit) query.limit = String(limit);
  if (before) query.before = String(before);

  const resp = await api.get<MessageHistoryResponse>(
    GO_MESSAGING_ROUTES.MESSAGES(conversationId),
    { params: query, timeout: 7000 },
  );
  return resp.data;
}

export async function sendMessageFallback(
  api: AxiosInstance,
  payload: SendMessagePayload,
): Promise<MessageResponse> {
  const resp = await api.post<MessageResponse>(
    GO_MESSAGING_ROUTES.MESSAGES(payload.conversationId),
    { content: payload.content },
    { timeout: 7000 },
  );
  return resp.data;
}

export async function fetchUserDirectory(
  api: AxiosInstance,
): Promise<UserDirectoryEntry[]> {
  try {
    const resp = await api.get<UserDirectoryEntry[]>(
      GO_USER_SERVICE_ROUTES.ALL,
      { timeout: 7000 },
    );
    return resp.data ?? [];
  } catch (err) {
    log.warn("fetchUserDirectory failed", err);
    throw err;
  }
}

export async function fetchMyTeams(
  api: AxiosInstance,
): Promise<TeamSummaryResponse[]> {
  const resp = await api.get<TeamListResponse>(GO_TEAM_SERVICE_ROUTES.ALL, {
    params: { my: true, size: 50 },
    timeout: 7000,
  });
  return resp.data.items ?? [];
}
