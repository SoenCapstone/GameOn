import { isCancelledMatchStatus, isPastMatch } from "@/utils/matches";
import type { HomeFeedItem } from "@/types/feed";

export function getHomeFeedItemTimestamp(item: HomeFeedItem) {
  if (item.kind === "match") {
    return new Date(item.startTime).getTime();
  }

  return new Date(item.createdAt).getTime();
}

export function sortHomeFeedItems(items: HomeFeedItem[]) {
  return [...items].sort(
    (left, right) =>
      getHomeFeedItemTimestamp(right) - getHomeFeedItemTimestamp(left),
  );
}

export function isUpcomingFeedMatch(match: {
  startTime: string;
  status: string;
}) {
  return !isCancelledMatchStatus(match.status) && !isPastMatch(match.startTime);
}

export function dedupeHomeFeedItems(items: HomeFeedItem[]) {
  const byKey = new Map<string, HomeFeedItem>();

  for (const item of items) {
    const key =
      item.kind === "match"
        ? `match:${item.id}`
        : `post:${item.space.kind}:${item.space.id}:${item.id}`;

    if (!byKey.has(key)) {
      byKey.set(key, item);
    }
  }

  return Array.from(byKey.values());
}
