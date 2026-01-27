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
