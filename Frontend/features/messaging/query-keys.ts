export const messagingKeys = {
  all: ["messaging"] as const,
  conversations: () => [...messagingKeys.all, "conversations"] as const,
  messages: (conversationId: string) =>
    [...messagingKeys.all, "messages", conversationId] as const,
  userDirectory: () => [...messagingKeys.all, "user-directory"] as const,
  myTeams: () => [...messagingKeys.all, "my-teams"] as const,
};
