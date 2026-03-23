import type { BubbleMessage } from "@/components/messages/bubble";

export type ConversationType = "DIRECT" | "GROUP";

export type ConversationParticipantRole = "OWNER" | "MEMBER";

export interface ConversationParticipantResponse {
  userId: string;
  role: ConversationParticipantRole;
  joinedAt: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface MessageHistoryResponse {
  messages: MessageResponse[];
  hasMore: boolean;
}

export interface ConversationResponse {
  id: string;
  type: ConversationType;
  teamId?: string | null;
  name?: string | null;
  isEvent: boolean;
  createdByUserId: string;
  createdAt: string;
  lastMessageAt?: string | null;
  participants: ConversationParticipantResponse[];
  lastMessage?: MessageResponse | null;
}

export interface ConversationListResponse {
  conversations: ConversationResponse[];
}

export interface DirectConversationPayload {
  targetUserId: string;
}

export interface TeamConversationPayload {
  name: string;
  isEvent: boolean;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
}

export interface UserDirectoryEntry {
  id: string;
  email: string;
  firstname?: string | null;
  lastname?: string | null;
  imageUrl?: string | null;
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

export interface FetchMessagesParams {
  conversationId: string;
  limit?: number;
  before?: string | null;
}

export type ChatListDateRow = {
  type: "date";
  id: string;
  label: string;
};

export type ChatListMessageRow = {
  type: "message";
  message: BubbleMessage;
};

export type ChatListRow = ChatListDateRow | ChatListMessageRow;

export const messagingKeys = {
  all: ["messaging"] as const,
  conversations: (userId?: string | null) =>
    [...messagingKeys.all, "conversations", userId ?? "anonymous"] as const,
  messages: (conversationId: string) =>
    [...messagingKeys.all, "messages", conversationId] as const,
  userDirectory: (userId?: string | null) =>
    [...messagingKeys.all, "user-directory", userId ?? "anonymous"] as const,
  myTeams: (userId?: string | null) =>
    [...messagingKeys.all, "my-teams", userId ?? "anonymous"] as const,
};
