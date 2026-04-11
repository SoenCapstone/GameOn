import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  dedupeHomeFeedItems,
  getHomeFeedItemTimestamp,
  isUpcomingFeedMatch,
  sortHomeFeedItems,
} from "@/utils/feed";
import type { HomeFeedItem } from "@/types/feed";

describe("feed utils", () => {
  const postItem: HomeFeedItem = {
    kind: "post",
    id: "post-1",
    createdAt: "2026-04-03T10:00:00.000Z",
    space: {
      id: "team-1",
      kind: "team",
      name: "Raptors",
      sport: "basketball",
      logoUrl: null,
    },
    post: {
      id: "post-1",
      authorName: "Coach",
      title: "Update",
      scope: "Members",
      body: "Body",
      createdAt: "2026-04-03T10:00:00.000Z",
    },
  };

  const matchItem: HomeFeedItem = {
    kind: "match",
    id: "match-1",
    createdAt: "2026-04-01T10:00:00.000Z",
    space: {
      id: "league-1",
      kind: "league",
      name: "Spring League",
      sport: "soccer",
      logoUrl: null,
    },
    match: {
      id: "match-1",
      leagueId: "league-1",
      status: "CONFIRMED",
      homeTeamId: "team-1",
      awayTeamId: "team-2",
      sport: "soccer",
      startTime: "2099-05-01T10:00:00.000Z",
      endTime: "2099-05-01T11:00:00.000Z",
      requiresReferee: false,
      createdByUserId: "user-1",
      createdAt: "2026-04-01T10:00:00.000Z",
      updatedAt: "2026-04-01T10:00:00.000Z",
    },
    contextLabel: "Spring League",
    homeName: "Raptors",
    awayName: "Wolves",
    sport: "soccer",
    status: "CONFIRMED",
    startTime: "2099-05-01T10:00:00.000Z",
    isPast: false,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 3, 4, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("uses startTime for match timestamps and createdAt for posts", () => {
    expect(getHomeFeedItemTimestamp(matchItem)).toBe(
      new Date("2099-05-01T10:00:00.000Z").getTime(),
    );
    expect(getHomeFeedItemTimestamp(postItem)).toBe(
      new Date("2026-04-03T10:00:00.000Z").getTime(),
    );
  });

  it("sorts home feed items by day group with matches before posts", () => {
    const sorted = sortHomeFeedItems([
      {
        ...postItem,
        id: "post-2",
        createdAt: "2026-04-03T18:00:00.000Z",
      },
      {
        ...matchItem,
        id: "match-today",
        startTime: "2026-04-04T08:00:00.000Z",
      },
      {
        ...postItem,
        id: "post-today",
        createdAt: "2026-04-04T13:00:00.000Z",
      },
      {
        ...matchItem,
        id: "match-tomorrow",
        startTime: "2026-04-05T08:00:00.000Z",
      },
      {
        ...postItem,
        id: "post-yesterday",
        createdAt: "2026-04-03T10:00:00.000Z",
      },
      {
        ...matchItem,
        id: "match-2-days-later",
        startTime: "2026-04-06T08:00:00.000Z",
      },
      {
        ...postItem,
        id: "post-2-days-ago",
        createdAt: "2026-04-02T10:00:00.000Z",
      },
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      "match-today",
      "post-today",
      "match-tomorrow",
      "post-2",
      "post-yesterday",
      "match-2-days-later",
      "post-2-days-ago",
    ]);
  });

  it("detects current and future match eligibility", () => {
    expect(
      isUpcomingFeedMatch({
        startTime: "2026-04-04T01:00:00",
        status: "CONFIRMED",
      }),
    ).toBe(true);

    expect(
      isUpcomingFeedMatch({
        startTime: "2026-04-05T10:00:00",
        status: "CONFIRMED",
      }),
    ).toBe(true);

    expect(
      isUpcomingFeedMatch({
        startTime: "2026-04-03T10:00:00",
        status: "CONFIRMED",
      }),
    ).toBe(false);

    expect(
      isUpcomingFeedMatch({
        startTime: "2026-04-05T10:00:00",
        status: "CANCELLED",
      }),
    ).toBe(false);
  });

  it("dedupes by match id and post space+id key", () => {
    const duplicateMatch: HomeFeedItem = {
      ...matchItem,
      createdAt: "2026-04-05T10:00:00.000Z",
    };

    const duplicatePostSameSpace: HomeFeedItem = {
      ...postItem,
      createdAt: "2026-04-06T10:00:00.000Z",
    };

    const samePostIdDifferentSpace: HomeFeedItem = {
      ...postItem,
      id: "post-1",
      space: {
        id: "team-2",
        kind: "team",
        name: "Wolves",
        sport: "basketball",
        logoUrl: null,
      },
    };

    const deduped = dedupeHomeFeedItems([
      matchItem,
      duplicateMatch,
      postItem,
      duplicatePostSameSpace,
      samePostIdDifferentSpace,
    ]);

    expect(deduped).toHaveLength(3);
    expect(deduped.map((item) => `${item.kind}:${item.id}`)).toEqual([
      "match:match-1",
      "post:post-1",
      "post:post-1",
    ]);
  });
});
