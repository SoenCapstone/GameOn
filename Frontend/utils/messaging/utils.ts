import type {
  ChatListRow,
  ConversationResponse,
  MessageHistoryResponse,
  MessageResponse,
} from "@/constants/messaging";
import type { InfiniteData } from "@tanstack/react-query";

type MessageValidation =
  | { valid: true; value: string }
  | { valid: false; reason: string };

export const maxMessageLength = 2000;

export function validateMessageContent(content: string): MessageValidation {
  const trimmed = content.trim();
  if (!trimmed) {
    return { valid: false, reason: "Message cannot be empty" };
  }
  if (trimmed.length > maxMessageLength) {
    return {
      valid: false,
      reason: `Message exceeds ${maxMessageLength} characters`,
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
    if (index !== 0) {
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
  return [...data.pages].reverse().flatMap((page) => page.messages ?? []);
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
  if (date.getFullYear() === now.getFullYear()) {
    return Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  }
  return Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function lastMessageId(rows: readonly ChatListRow[]): string | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row.type === "message") return row.message.id;
  }
  return null;
}

export function buildChatListRows(
  messages: readonly MessageResponse[],
  userId: string | null | undefined,
  resolveSenderName: (senderId: string) => string,
): ChatListRow[] {
  const out: ChatListRow[] = [];
  let lastDayKey: string | null = null;
  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (dayKey !== lastDayKey) {
      lastDayKey = dayKey;
      out.push({
        type: "date",
        id: `date-${dayKey}`,
        label: formatDateSeparator(msg.createdAt),
      });
    }
    out.push({
      type: "message",
      message: {
        id: msg.id,
        text: msg.content,
        fromMe: msg.senderId === userId,
        senderLabel:
          msg.senderId === userId ? undefined : resolveSenderName(msg.senderId),
        createdAt: msg.createdAt,
      },
    });
  }
  return out;
}
