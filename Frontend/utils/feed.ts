import { isCancelledMatchStatus, isPastMatch } from "@/utils/matches";
import type { HomeFeedItem } from "@/types/feed";
import { isToday, startOfLocalDay } from "@/utils/date";

const dayMs = 24 * 60 * 60 * 1000;

export function getHomeFeedItemTimestamp(item: HomeFeedItem) {
  if (item.kind === "match") {
    return new Date(item.startTime).getTime();
  }

  return new Date(item.createdAt).getTime();
}

export function getHomeFeedItemDayOffset(item: HomeFeedItem) {
  const today = startOfLocalDay(new Date()).getTime();
  const itemDay = startOfLocalDay(
    new Date(getHomeFeedItemTimestamp(item)),
  ).getTime();

  return Math.round((itemDay - today) / dayMs);
}

export function getHomeFeedItemSortBucket(item: HomeFeedItem) {
  const dayOffset = getHomeFeedItemDayOffset(item);

  if (item.kind === "match") {
    return dayOffset >= 0 ? dayOffset * 2 : 10_000 + Math.abs(dayOffset) * 2;
  }

  if (dayOffset <= 0) {
    return Math.abs(dayOffset) * 2 + 1;
  }

  return 20_000 + dayOffset * 2 + 1;
}

export function compareHomeFeedItems(left: HomeFeedItem, right: HomeFeedItem) {
  const bucketDifference = getHomeFeedItemSortBucket(left) - getHomeFeedItemSortBucket(right);

  if (bucketDifference !== 0) {
    return bucketDifference;
  }

  const leftTimestamp = getHomeFeedItemTimestamp(left);
  const rightTimestamp = getHomeFeedItemTimestamp(right);

  if (left.kind === "match" && right.kind === "match") {
    return leftTimestamp - rightTimestamp;
  }

  if (left.kind === "post" && right.kind === "post") {
    return rightTimestamp - leftTimestamp;
  }

  return left.id.localeCompare(right.id);
}

export function sortHomeFeedItems(items: HomeFeedItem[]) {
  return [...items].sort(compareHomeFeedItems);
}

export function isUpcomingFeedMatch(match: {
  startTime: string;
  status: string;
}) {
  return (
    !isCancelledMatchStatus(match.status) &&
    (isToday(new Date(match.startTime)) || !isPastMatch(match.startTime))
  );
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
