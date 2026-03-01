import {
  getMatchSection,
  toBadgeStatus,
  sortUpcomingFirst,
  sortPastLatestFirst,
  formatMatchDateTime,
  mapTeamsById,
  filterPendingTeamInvitesForOwner,
  buildMatchCards,
  splitMatchSections,
} from "@/features/matches/utils";
import type {
  TeamSummary,
  TeamMatch,
  LeagueMatch,
} from "@/features/matches/types";

describe("getMatchSection", () => {
  it("returns 'current' when now is between start and end and not cancelled", () => {
    const now = Date.now();
    expect(
      getMatchSection(
        new Date(now - 1000).toISOString(),
        new Date(now + 1000).toISOString(),
        "CONFIRMED",
      ),
    ).toBe("current");
  });
  it("returns 'upcoming' when now is before start", () => {
    const now = Date.now();
    expect(
      getMatchSection(
        new Date(now + 10000).toISOString(),
        new Date(now + 20000).toISOString(),
        "CONFIRMED",
      ),
    ).toBe("upcoming");
  });
  it("returns 'past' when now is after end", () => {
    const now = Date.now();
    expect(
      getMatchSection(
        new Date(now - 20000).toISOString(),
        new Date(now - 10000).toISOString(),
        "CONFIRMED",
      ),
    ).toBe("past");
  });
  it("returns 'past' when status is CANCELLED", () => {
    const now = Date.now();
    expect(
      getMatchSection(
        new Date(now - 1000).toISOString(),
        new Date(now + 1000).toISOString(),
        "CANCELLED",
      ),
    ).toBe("past");
  });
});

describe("toBadgeStatus", () => {
  it("maps statuses to badge", () => {
    expect(toBadgeStatus("PENDING_TEAM_ACCEPTANCE")).toBe("PENDING");
    expect(toBadgeStatus("DECLINED")).toBe("CANCELLED");
    expect(toBadgeStatus("CANCELLED")).toBe("CANCELLED");
    expect(toBadgeStatus("CONFIRMED")).toBe("CONFIRMED");
    expect(toBadgeStatus("ANYTHING_ELSE")).toBe("COMPLETED");
  });
});

describe("sortUpcomingFirst", () => {
  it("sorts items by startTime ascending", () => {
    const items = [
      { startTime: "2023-01-02T00:00:00Z" },
      { startTime: "2023-01-01T00:00:00Z" },
    ];
    const sorted = sortUpcomingFirst(items);
    expect(sorted[0].startTime).toBe("2023-01-01T00:00:00Z");
  });
});

describe("sortPastLatestFirst", () => {
  it("sorts items by startTime descending", () => {
    const items = [
      { startTime: "2023-01-01T00:00:00Z" },
      { startTime: "2023-01-02T00:00:00Z" },
    ];
    const sorted = sortPastLatestFirst(items);
    expect(sorted[0].startTime).toBe("2023-01-02T00:00:00Z");
  });
});

describe("formatMatchDateTime", () => {
  it("formats date string", () => {
    const date = "2023-01-01T12:34:00Z";
    expect(typeof formatMatchDateTime(date)).toBe("string");
  });
});

describe("mapTeamsById", () => {
  it("maps teams by id", () => {
    const teams: TeamSummary[] = [
      { id: "t1", name: "A" },
      { id: "t2", name: "B" },
    ];
    const map = mapTeamsById(teams);
    expect(map.t1.name).toBe("A");
    expect(map.t2.name).toBe("B");
  });
});

describe("filterPendingTeamInvitesForOwner", () => {
  it("filters matches for owner team", () => {
    const matches: TeamMatch[] = [
      {
        id: "m1",
        matchType: "TEAM_MATCH",
        status: "PENDING_TEAM_ACCEPTANCE",
        homeTeamId: "h1",
        awayTeamId: "owner1",
        sport: "Soccer",
        startTime: "2023-01-01T00:00:00Z",
        endTime: "2023-01-01T01:00:00Z",
        requiresReferee: false,
        createdByUserId: "u1",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
      {
        id: "m2",
        matchType: "TEAM_MATCH",
        status: "CONFIRMED",
        homeTeamId: "h1",
        awayTeamId: "owner1",
        sport: "Soccer",
        startTime: "2023-01-01T00:00:00Z",
        endTime: "2023-01-01T01:00:00Z",
        requiresReferee: false,
        createdByUserId: "u1",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
      {
        id: "m3",
        matchType: "TEAM_MATCH",
        status: "PENDING_TEAM_ACCEPTANCE",
        homeTeamId: "h1",
        awayTeamId: "other",
        sport: "Soccer",
        startTime: "2023-01-01T00:00:00Z",
        endTime: "2023-01-01T01:00:00Z",
        requiresReferee: false,
        createdByUserId: "u1",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
    ];
    const filtered = filterPendingTeamInvitesForOwner(matches, "owner1");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].awayTeamId).toBe("owner1");
  });
});

describe("buildMatchCards", () => {
  it("builds match cards from matches and team map", () => {
    const matches: (LeagueMatch | TeamMatch)[] = [
      {
        id: "m1",
        leagueId: "l1",
        status: "CONFIRMED",
        homeTeamId: "t1",
        awayTeamId: "t2",
        sport: "Soccer",
        startTime: "2023-01-01T00:00:00Z",
        endTime: "2023-01-01T01:00:00Z",
        requiresReferee: false,
        createdByUserId: "u1",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      } as LeagueMatch,
    ];
    const teamMap: Record<string, TeamSummary> = {
      t1: { id: "t1", name: "Team 1", logoUrl: "logo1" },
      t2: { id: "t2", name: "Team 2", logoUrl: "logo2" },
    };
    const cards = buildMatchCards(matches, teamMap, "Context");
    expect(cards[0].homeName).toBe("Team 1");
    expect(cards[0].awayName).toBe("Team 2");
    expect(cards[0].contextLabel).toBe("Context");
    expect(cards[0].isPast).toBeDefined();
  });
});

describe("splitMatchSections", () => {
  it("splits match items into sections", () => {
    const now = Date.now();
    const items: {
      section: "current" | "upcoming" | "past";
      isPast: boolean;
      startTime: string;
    }[] = [
      {
        section: "current",
        isPast: false,
        startTime: new Date(now).toISOString(),
      },
      {
        section: "upcoming",
        isPast: false,
        startTime: new Date(now + 10000).toISOString(),
      },
      {
        section: "past",
        isPast: true,
        startTime: new Date(now - 10000).toISOString(),
      },
    ];
    const sections = splitMatchSections(items);
    expect(sections.current).toHaveLength(1);
    expect(sections.upcoming).toHaveLength(1);
    expect(sections.past).toHaveLength(1);
  });
});
