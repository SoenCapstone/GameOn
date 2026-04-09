import { describe, expect, it } from "@jest/globals";
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

  it("uses startTime for match timestamps and createdAt for posts", () => {
    expect(getHomeFeedItemTimestamp(matchItem)).toBe(
      new Date("2099-05-01T10:00:00.000Z").getTime(),
    );
    expect(getHomeFeedItemTimestamp(postItem)).toBe(
      new Date("2026-04-03T10:00:00.000Z").getTime(),
    );
  });

  it("sorts home feed items newest first by computed timestamp", () => {
    const sorted = sortHomeFeedItems([postItem, matchItem]);
    expect(sorted.map((item) => item.id)).toEqual(["match-1", "post-1"]);
  });

  it("detects upcoming match eligibility", () => {
    expect(
      isUpcomingFeedMatch({
        startTime: "2099-04-01T10:00:00.000Z",
        status: "CONFIRMED",
      }),
    ).toBe(true);

    expect(
      isUpcomingFeedMatch({
        startTime: "2000-04-01T10:00:00.000Z",
        status: "CONFIRMED",
      }),
    ).toBe(false);

    expect(
      isUpcomingFeedMatch({
        startTime: "2099-04-01T10:00:00.000Z",
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
