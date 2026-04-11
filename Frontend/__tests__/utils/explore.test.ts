import {
  buildExploreMatchesBody,
  buildExploreMatchesQueryKey,
  exploreLeagueIds,
  exploreMapRegion,
  exploreMatchContextLabel,
  exploreTeamIds,
  filterExploreMatches,
  getExploreMatches,
  hideMarkerCallouts,
  mergeExploreMatchesResults,
  showExplorePreferenceErrorToast,
  trackMarker,
} from "@/utils/explore";
import { defaultExplorePreferences } from "@/constants/explore";
import { toast } from "@/utils/toast";

jest.mock("@/utils/toast", () => ({
  toast: {
    error: jest.fn(),
  },
}));

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

describe("buildExploreMatchesBody", () => {
  it("returns null when coordinates or range are invalid", () => {
    expect(
      buildExploreMatchesBody({
        latitude: undefined,
        longitude: -79.38,
        rangeKm: 10,
      }),
    ).toBeNull();
    expect(
      buildExploreMatchesBody({
        latitude: 43.65,
        longitude: -79.38,
        rangeKm: 0,
      }),
    ).toBeNull();
  });

  it("trims sport and omits the All option", () => {
    expect(
      buildExploreMatchesBody({
        latitude: 43.65,
        longitude: -79.38,
        rangeKm: 10,
        sport: " soccer ",
      }),
    ).toEqual({
      latitude: 43.65,
      longitude: -79.38,
      rangeKm: 10,
      sport: "soccer",
    });

    expect(
      buildExploreMatchesBody({
        latitude: 43.65,
        longitude: -79.38,
        rangeKm: 10,
        sport: " All ",
      }),
    ).toEqual({
      latitude: 43.65,
      longitude: -79.38,
      rangeKm: 10,
    });
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

describe("explore helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("merges and sorts team and league matches by start time", () => {
    const leagueMatch = {
      id: "lm-1",
      startTime: "2026-04-11T18:00:00Z",
    };
    const teamMatch = {
      id: "tm-1",
      startTime: "2026-04-10T18:00:00Z",
    };

    expect(
      mergeExploreMatchesResults([leagueMatch] as never, [teamMatch] as never),
    ).toEqual([
      { kind: "team", match: teamMatch },
      { kind: "league", match: leagueMatch },
    ]);
  });

  it("extracts plain matches and unique team and league ids", () => {
    const matches = getExploreMatches([
      {
        kind: "league",
        match: {
          id: "lm-1",
          leagueId: "league-1",
          homeTeamId: "team-1",
          awayTeamId: "team-2",
        },
      },
      {
        kind: "team",
        match: {
          id: "tm-1",
          homeTeamId: "team-1",
          awayTeamId: "team-3",
        },
      },
    ] as never);

    expect(matches).toEqual([
      {
        id: "lm-1",
        leagueId: "league-1",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
      },
      {
        id: "tm-1",
        homeTeamId: "team-1",
        awayTeamId: "team-3",
      },
    ]);
    expect(exploreTeamIds(matches as never)).toEqual([
      "team-1",
      "team-2",
      "team-3",
    ]);
    expect(exploreLeagueIds(matches as never)).toEqual(["league-1"]);
  });

  it("builds league and team context labels", () => {
    expect(
      exploreMatchContextLabel(
        { leagueId: "league-1" } as never,
        { "league-1": { name: "Weekend League" } },
      ),
    ).toBe("Weekend League");
    expect(
      exploreMatchContextLabel({ leagueId: "league-2" } as never, undefined),
    ).toBe("League Match");
    expect(exploreMatchContextLabel({} as never, undefined)).toBe("Team Match");
  });

  it("builds a map region and falls back to the default coordinates", () => {
    expect(exploreMapRegion(43.65, -79.38, 0.25)).toEqual({
      latitude: 43.65,
      longitude: -79.38,
      latitudeDelta: 0.25,
      longitudeDelta: 0.25,
    });

    expect(exploreMapRegion(undefined, undefined, 0.1)).toEqual({
      latitude: defaultExplorePreferences.coordinates.latitude,
      longitude: defaultExplorePreferences.coordinates.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
  });

  it("tracks markers and hides their callouts", () => {
    const refs = { current: new Map<string, { hideCallout?: () => void }>() };
    const marker = { hideCallout: jest.fn() };

    trackMarker(refs, "venue-1", marker);
    hideMarkerCallouts(refs);
    trackMarker(refs, "venue-1", null);

    expect(marker.hideCallout).toHaveBeenCalledTimes(1);
    expect(refs.current.size).toBe(0);
  });

  it("shows a toast when required preferences are missing", () => {
    showExplorePreferenceErrorToast({
      sport: undefined,
      location: "Toronto",
      rangeKm: undefined,
    });

    expect(toast.error).toHaveBeenCalledWith("Sport, Range are Not Set", {
      id: "explore-preferences",
      description: "Update your Explore Preferences in Settings.",
    });
  });

  it("does not show a toast when all preferences are set", () => {
    showExplorePreferenceErrorToast({
      sport: "Soccer",
      location: "Toronto",
      rangeKm: 10,
    });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it("uses singular grammar when exactly one preference is missing", () => {
    showExplorePreferenceErrorToast({
      sport: "Soccer",
      location: undefined,
      rangeKm: 10,
    });

    expect(toast.error).toHaveBeenCalledWith("Location is Not Set", {
      id: "explore-preferences",
      description: "Update your Explore Preferences in Settings.",
    });
  });
});
