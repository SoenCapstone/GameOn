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
