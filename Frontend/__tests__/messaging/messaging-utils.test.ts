import { 
  validateMessageContent,
  sortConversations,
  insertMessageOrdered,
  appendMessageToPages,
  updateConversationsWithMessage,
  buildMessagesFromPages,
  formatMessageTimestamp,
  formatDateSeparator,
  MAX_MESSAGE_LENGTH,
} from "@/features/messaging/utils";
import type { InfiniteData } from "@tanstack/react-query";
import {
  ConversationResponse,
  MessageHistoryResponse,
  MessageResponse,
} from "@/features/messaging/types";

describe("validateMessageContent", () => {
  it("rejects empty and whitespace-only input with correct reason", () => {
    const result1 = validateMessageContent("   ");
    expect(result1.valid).toBe(false);
    if (!result1.valid) {
      expect(result1.reason).toBe("Message cannot be empty");
    }

    const result2 = validateMessageContent("");
    expect(result2.valid).toBe(false);
    if (!result2.valid) {
      expect(result2.reason).toBe("Message cannot be empty");
    }
  });

  it("rejects oversized content and exceeding max length", () => {
    const large = "a".repeat(2100);
    const result1 = validateMessageContent(large);
    expect(result1.valid).toBe(false);

    const tooLong = "a".repeat(MAX_MESSAGE_LENGTH + 1);
    const result2 = validateMessageContent(tooLong);
    expect(result2.valid).toBe(false);
    if (!result2.valid) {
      expect(result2.reason).toContain("2000");
    }
  });

  it("accepts trimmed and whitespace-handled messages", () => {
    const result1 = validateMessageContent("  hello  ");
    expect(result1.valid).toBe(true);
    if (result1.valid) {
      expect(result1.value).toBe("hello");
    }

    const result2 = validateMessageContent("  \t\n  hello world  \n\t  ");
    expect(result2.valid).toBe(true);
    if (result2.valid) {
      expect(result2.value).toBe("hello world");
    }
  });

  it("respects length boundaries (max and single character)", () => {
    const maxMessage = "a".repeat(MAX_MESSAGE_LENGTH);
    const result1 = validateMessageContent(maxMessage);
    expect(result1.valid).toBe(true);
    if (result1.valid) {
      expect(result1.value).toBe(maxMessage);
    }

    const result2 = validateMessageContent("a");
    expect(result2.valid).toBe(true);
    if (result2.valid) {
      expect(result2.value).toBe("a");
    }
  });

  it("handles special characters and unicode", () => {
    const result1 = validateMessageContent("Hello @#$% & special!");
    expect(result1.valid).toBe(true);
    if (result1.valid) {
      expect(result1.value).toBe("Hello @#$% & special!");
    }

    const result2 = validateMessageContent("Hello 🎉 世界");
    expect(result2.valid).toBe(true);
    if (result2.valid) {
      expect(result2.value).toBe("Hello 🎉 世界");
    }
  });
});

describe("sortConversations", () => {
  const createConversation = (
    id: string,
    createdAt: string,
    lastMessageAt?: string,
  ): ConversationResponse => ({
    id,
    type: "GROUP",
    isEvent: false,
    createdByUserId: "user-1",
    createdAt,
    lastMessageAt,
    participants: [],
    lastMessage: undefined,
  });

  it("sorts by lastMessageAt descending, falling back to createdAt", () => {
    const conversations = [
      createConversation("conv-1", "2024-01-01", "2024-01-03"),
      createConversation("conv-2", "2024-01-02", "2024-01-02"),
      createConversation("conv-3", "2024-01-01"),
    ];

    const sorted = sortConversations(conversations);
    expect(sorted[0].id).toBe("conv-1");
    expect(sorted[1].id).toBe("conv-2");
    expect(sorted[2].id).toBe("conv-3");
  });

  it("does not mutate original array", () => {
    const conversations = [
      createConversation("conv-1", "2024-01-01", "2024-01-02"),
      createConversation("conv-2", "2024-01-03", "2024-01-04"),
    ];
    const original = [...conversations];

    sortConversations(conversations);

    expect(conversations).toEqual(original);
  });

  it("handles edge cases (single and empty arrays)", () => {
    const single = [createConversation("conv-1", "2024-01-01")];
    const sortedSingle = sortConversations(single);
    expect(sortedSingle).toHaveLength(1);
    expect(sortedSingle[0].id).toBe("conv-1");

    const empty = sortConversations([]);
    expect(empty).toEqual([]);
  });
});

describe("insertMessageOrdered", () => {
  const createMessage = (id: string, createdAt: string): MessageResponse => ({
    id,
    content: "test",
    createdAt,
    conversationId: "conv-1",
    senderId: "user-1",
  });

  it("appends message when list is empty or newer than all existing", () => {
    const emptyList: MessageResponse[] = [];
    const incoming1 = createMessage("msg-1", "2024-01-01");
    const result1 = insertMessageOrdered(emptyList, incoming1);
    expect(result1).toHaveLength(1);
    expect(result1[0].id).toBe("msg-1");

    const list = [
      createMessage("msg-1", "2024-01-01T10:00:00Z"),
      createMessage("msg-2", "2024-01-01T11:00:00Z"),
    ];
    const incoming2 = createMessage("msg-3", "2024-01-01T12:00:00Z");
    const result2 = insertMessageOrdered(list, incoming2);
    expect(result2).toHaveLength(3);
    expect(result2[2].id).toBe("msg-3");
  });

  it("inserts message at correct position in middle", () => {
    const list = [
      createMessage("msg-1", "2024-01-01T10:00:00Z"),
      createMessage("msg-3", "2024-01-01T12:00:00Z"),
    ];
    const incoming = createMessage("msg-2", "2024-01-01T11:00:00Z");
    const result = insertMessageOrdered(list, incoming);
    expect(result).toHaveLength(3);
    expect(result[1].id).toBe("msg-2");
  });

  it("does not insert duplicate message or mutate original", () => {
    const msg = createMessage("msg-1", "2024-01-01");
    const list = [msg];
    const result = insertMessageOrdered(list, msg);
    expect(result).toEqual(list);
    expect(result).toHaveLength(1);

    const list2 = [createMessage("msg-1", "2024-01-01")];
    const original = [...list2];
    const incoming = createMessage("msg-2", "2024-01-02");
    insertMessageOrdered(list2, incoming);
    expect(list2).toEqual(original);
  });
});

describe("appendMessageToPages", () => {
  const createMessage = (id: string): MessageResponse => ({
    id,
    content: "test",
    createdAt: "2024-01-01T10:00:00Z",
    conversationId: "conv-1",
    senderId: "user-1",
  });

  const createPage = (messages: MessageResponse[]): MessageHistoryResponse => ({
    messages,
    hasMore: false,
  });

  it("returns undefined if data is undefined", () => {
    const incoming = createMessage("msg-1");
    const result = appendMessageToPages(undefined, incoming);
    expect(result).toBeUndefined();
  });

  it("appends to last page and does not modify non-last pages", () => {
    const msg1 = createMessage("msg-1");
    const data: InfiniteData<MessageHistoryResponse> = {
      pages: [
        createPage([msg1]),
        createPage([createMessage("msg-2")]),
      ],
      pageParams: [undefined, null],
    };
    const incoming = createMessage("msg-3");
    const result = appendMessageToPages(data, incoming);

    expect(result?.pages[0].messages?.[0].id).toBe("msg-1");
    expect(result?.pages[1].messages).toHaveLength(2);
    expect(result?.pages[1].messages?.[1].id).toBe("msg-3");
  });

  it("handles empty and undefined messages arrays in pages", () => {
    const data1: InfiniteData<MessageHistoryResponse> = {
      pages: [createPage([]), createPage([])],
      pageParams: [undefined, null],
    };
    const incoming = createMessage("msg-1");
    const result1 = appendMessageToPages(data1, incoming);
    expect(result1?.pages[1].messages).toHaveLength(1);

    const data2: InfiniteData<MessageHistoryResponse> = {
      pages: [
        { messages: [createMessage("msg-1")], hasMore: false },
        { messages: [], hasMore: false },
      ],
      pageParams: [undefined, null],
    };
    const result2 = appendMessageToPages(data2, incoming);
    expect(result2?.pages[1].messages).toHaveLength(1);
  });
});

describe("updateConversationsWithMessage", () => {
  const createMessage = (id: string, conversationId: string): MessageResponse => ({
    id,
    content: "test",
    createdAt: "2024-01-01T10:00:00Z",
    conversationId,
    senderId: "user-1",
  });

  const createConversation = (id: string): ConversationResponse => ({
    id,
    type: "GROUP",
    isEvent: false,
    createdByUserId: "user-1",
    createdAt: "2024-01-01",
    participants: [],
    lastMessage: undefined,
  });

  it("returns undefined if conversations is undefined or handles empty array", () => {
    const incoming = createMessage("msg-1", "conv-1");
    const result1 = updateConversationsWithMessage(undefined, incoming);
    expect(result1).toBeUndefined();

    const result2 = updateConversationsWithMessage([], incoming);
    expect(result2).toEqual([]);
  });

  it("updates correct conversation and ignores non-matching conversations", () => {
    const conversations = [
      createConversation("conv-1"),
      createConversation("conv-2"),
    ];
    const incoming = createMessage("msg-1", "conv-1");
    const result = updateConversationsWithMessage(conversations, incoming);

    expect(result?.[0].lastMessage).toEqual(incoming);
    expect(result?.[0].lastMessageAt).toBe(incoming.createdAt);
    expect(result?.[1].lastMessage).toBeUndefined();
  });

  it("sorts conversations after update", () => {
    const conversations = [
      createConversation("conv-1"),
      createConversation("conv-2"),
    ];
    const incoming = createMessage("msg-1", "conv-1");
    incoming.createdAt = "2024-01-02T10:00:00Z";
    const result = updateConversationsWithMessage(conversations, incoming);

    expect(result?.[0].id).toBe("conv-1");
  });
});

describe("buildMessagesFromPages", () => {
  const createMessage = (id: string): MessageResponse => ({
    id,
    content: "test",
    createdAt: "2024-01-01",
    conversationId: "conv-1",
    senderId: "user-1",
  });

  it("returns empty array if data is undefined and flattens messages from all pages", () => {
    const result1 = buildMessagesFromPages(undefined);
    expect(result1).toEqual([]);

    const data: InfiniteData<MessageHistoryResponse> = {
      pages: [
        { messages: [createMessage("msg-1"), createMessage("msg-2")], hasMore: false },
        { messages: [createMessage("msg-3"), createMessage("msg-4")], hasMore: false },
      ],
      pageParams: [undefined, null],
    };
    const result2 = buildMessagesFromPages(data);
    expect(result2).toHaveLength(4);
    expect(result2[0].id).toBe("msg-1");
    expect(result2[3].id).toBe("msg-4");
  });

  it("handles undefined and empty messages arrays in pages", () => {
    const data1: InfiniteData<MessageHistoryResponse> = {
      pages: [{ messages: [createMessage("msg-1")], hasMore: false }, { messages: [], hasMore: false }],
      pageParams: [undefined, null],
    };
    const result1 = buildMessagesFromPages(data1);
    expect(result1).toHaveLength(1);
    expect(result1[0].id).toBe("msg-1");

    const data2: InfiniteData<MessageHistoryResponse> = {
      pages: [{ messages: [], hasMore: false }, { messages: [], hasMore: false }],
      pageParams: [undefined, null],
    };
    const result2 = buildMessagesFromPages(data2);
    expect(result2).toEqual([]);
  });

  it("does not mutate original data", () => {
    const messages = [createMessage("msg-1")];
    const data: InfiniteData<MessageHistoryResponse> = {
      pages: [{ messages, hasMore: false }],
      pageParams: [undefined],
    };
    const original = { ...data };

    buildMessagesFromPages(data);

    expect(data).toEqual(original);
  });
});

describe("formatMessageTimestamp", () => {
  it("returns empty string for null, undefined, invalid, or empty timestamps", () => {
    expect(formatMessageTimestamp(null)).toBe("");
    expect(formatMessageTimestamp()).toBe("");
    expect(formatMessageTimestamp("")).toBe("");
    expect(formatMessageTimestamp("invalid-date")).toBe("");
  });

  it("formats valid timestamp in HH:MM format", () => {
    const timestamp = "2024-01-01T14:30:00Z";
    const result = formatMessageTimestamp(timestamp);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("handles various timestamp formats (ISO 8601, timezones, boundaries)", () => {
    const result1 = formatMessageTimestamp("2024-01-01T14:30:00+05:00");
    expect(result1).toMatch(/\d{1,2}:\d{2}/);

    const result2 = formatMessageTimestamp("2024-12-25T23:59:59.999Z");
    expect(result2).toMatch(/\d{1,2}:\d{2}/);

    const result3 = formatMessageTimestamp("2024-12-31T23:59:59Z");
    expect(result3).toMatch(/\d{1,2}:\d{2}/);

    const result4 = formatMessageTimestamp("2024-01-01T00:00:00Z");
    expect(result4).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("formatDateSeparator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 1, 21, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns Today for messages from the current day", () => {
    const result = formatDateSeparator(new Date(2026, 1, 21, 8, 15, 0));
    expect(result).toBe("Today");
  });

  it("returns Yesterday for messages from one day before", () => {
    const result = formatDateSeparator(new Date(2026, 1, 20, 23, 59, 0));
    expect(result).toBe("Yesterday");
  });

  it("returns full weekday name for 2-6 days ago", () => {
    const target = new Date(2026, 1, 18, 9, 0, 0);
    const expected = Intl.DateTimeFormat(undefined, { weekday: "long" }).format(
      target,
    );
    expect(formatDateSeparator(target)).toBe(expected);
  });

  it("returns short date format for older dates", () => {
    const target = new Date(2026, 0, 10, 9, 0, 0);
    const expected = Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(target);

    expect(formatDateSeparator(target)).toBe(expected);
  });
});
