import type { InfiniteData } from "@tanstack/react-query";
import {
  ConversationResponse,
  MessageHistoryResponse,
  MessageResponse,
} from "@/features/messaging/types";

type MessageValidation =
  | { valid: true; value: string }
  | { valid: false; reason: string };

export const MAX_MESSAGE_LENGTH = 2000;

export function validateMessageContent(content: string): MessageValidation {
  const trimmed = content.trim();
  if (!trimmed) {
    return { valid: false, reason: "Message cannot be empty" };
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      reason: `Message exceeds ${MAX_MESSAGE_LENGTH} characters`,
    };
  }
  return { valid: true, value: trimmed } as const;
}

export function sortConversations(conversations: ConversationResponse[]) {
  return [...conversations].sort((a, b) => {
    const dateA = new Date(a.lastMessageAt ?? a.createdAt).getTime();
    const dateB = new Date(b.lastMessageAt ?? b.createdAt).getTime();
    return dateB - dateA;
  });
}

export function insertMessageOrdered(
  list: MessageResponse[],
  incoming: MessageResponse,
) {
  if (list.some((m) => m.id === incoming.id)) {
    return list;
  }
  const idx = list.findIndex(
    (m) =>
      new Date(m.createdAt).getTime() > new Date(incoming.createdAt).getTime(),
  );
  if (idx === -1) {
    return [...list, incoming];
  }
  return [...list.slice(0, idx), incoming, ...list.slice(idx)];
}

export function appendMessageToPages(
  data: InfiniteData<MessageHistoryResponse> | undefined,
  incoming: MessageResponse,
): InfiniteData<MessageHistoryResponse> | undefined {
  if (!data) return data;
  const pages = data.pages.map((page, index) => {
    if (index !== data.pages.length - 1) {
      return page;
    }
    return {
      ...page,
      messages: insertMessageOrdered(page.messages ?? [], incoming),
    };
  });
  return { ...data, pages };
}

export function updateConversationsWithMessage(
  conversations: ConversationResponse[] | undefined,
  incoming: MessageResponse,
): ConversationResponse[] | undefined {
  if (!conversations) return conversations;
  const updated = conversations.map((conversation) => {
    if (conversation.id !== incoming.conversationId) {
      return conversation;
    }
    return {
      ...conversation,
      lastMessage: incoming,
      lastMessageAt: incoming.createdAt,
    };
  });
  return sortConversations(updated);
}

export function buildMessagesFromPages(
  data: InfiniteData<MessageHistoryResponse> | undefined,
): MessageResponse[] {
  if (!data) return [];
  return data.pages.flatMap((page) => page.messages ?? []);
}

export function formatMessageTimestamp(timestamp?: string | null) {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    return Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}

export function formatDateSeparator(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffMs = todayStart.getTime() - dateStart.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays >= 2 && diffDays <= 6) {
    return Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
  }
  return Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}
