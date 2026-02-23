import { AxiosInstance } from "axios";
import {
  GO_MESSAGING_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
  GO_USER_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { createScopedLog } from "@/utils/logger";
import {
  ConversationListResponse,
  ConversationResponse,
  DirectConversationPayload,
  MessageHistoryResponse,
  MessageResponse,
  SendMessagePayload,
  TeamConversationPayload,
} from "@/features/messaging/types";

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

export interface FetchMessagesParams {
  conversationId: string;
  limit?: number;
  before?: string | null;
}

export async function fetchMessages(
  api: AxiosInstance,
  params: FetchMessagesParams,
): Promise<MessageHistoryResponse> {
  const { conversationId, limit, before } = params;
  const query: Record<string, string> = {};
  if (limit) query.limit = String(limit);
  if (before) query.before = before;

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

export interface UserDirectoryEntry {
  id: string;
  email: string;
  firstname?: string | null;
  lastname?: string | null;
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

export interface TeamSummaryResponse {
  id: string;
  name: string;
  sport?: string | null;
  slug?: string | null;
  logoUrl?: string | null;
  privacy?: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamListResponse {
  items: TeamSummaryResponse[];
  totalElements: number;
  page: number;
  size: number;
  hasNext: boolean;
}

export async function fetchMyTeams(api: AxiosInstance): Promise<TeamSummaryResponse[]> {
  const resp = await api.get<TeamListResponse>(GO_TEAM_SERVICE_ROUTES.ALL, {
    params: { my: true, size: 50 },
    timeout: 7000,
  });
  return resp.data.items ?? [];
}
