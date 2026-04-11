import {
  buildExploreMatchesQueryKey,
  filterExploreMatches,
} from "@/utils/explore";

describe("buildExploreMatchesQueryKey", () => {
  it("includes sport or all placeholder and coordinates", () => {
    expect(
      buildExploreMatchesQueryKey({
        latitude: 43.65,
        longitude: -79.38,
        rangeKm: 10,
        sport: "soccer",
      }),
    ).toEqual(["explore-matches", "soccer", 43.65, -79.38, 10]);

    expect(
      buildExploreMatchesQueryKey({
        latitude: 1,
        longitude: 2,
        rangeKm: 5,
      }),
    ).toEqual(["explore-matches", "all", 1, 2, 5]);
  });
});

describe("filterExploreMatches", () => {
  const league = {
    kind: "league" as const,
    match: {
      id: "lm-1",
      leagueId: "leg-1",
      status: "CONFIRMED" as const,
      homeTeamId: "h1",
      awayTeamId: "a1",
      sport: "soccer",
      startTime: "2026-04-10T18:00:00Z",
      endTime: "2026-04-10T20:00:00Z",
      venueId: "v1",
      requiresReferee: false,
      createdByUserId: "u1",
      createdAt: "2026-04-01T00:00:00Z",
      updatedAt: "2026-04-01T00:00:00Z",
    },
  };
  const team = {
    kind: "team" as const,
    match: {
      id: "tm-1",
      matchType: "TEAM_MATCH" as const,
      status: "CONFIRMED" as const,
      homeTeamId: "h2",
      awayTeamId: "a2",
      sport: "soccer",
      startTime: "2026-04-09T18:00:00Z",
      endTime: "2026-04-09T20:00:00Z",
      venueId: "v2",
      requiresReferee: false,
      createdByUserId: "u1",
      createdAt: "2026-04-01T00:00:00Z",
      updatedAt: "2026-04-01T00:00:00Z",
    },
  };
  const items = [league, team];

  it("returns all rows when filter is all and no venue focus", () => {
    expect(filterExploreMatches(items, "all", null)).toEqual(items);
  });

  it("filters by league or team kind", () => {
    expect(filterExploreMatches(items, "league", null)).toEqual([league]);
    expect(filterExploreMatches(items, "team", null)).toEqual([team]);
  });

  it("filters by focused venue", () => {
    expect(filterExploreMatches(items, "all", "v1")).toEqual([league]);
  });

  it("combines kind and venue filters", () => {
    expect(filterExploreMatches(items, "team", "v1")).toEqual([]);
    expect(filterExploreMatches(items, "team", "v2")).toEqual([team]);
  });
});
