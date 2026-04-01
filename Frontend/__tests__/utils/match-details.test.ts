import {
  getDirectLeagueMatchId,
  getResolvedMatchLeagueId,
  getTeamSpaceId,
  getDisplayMatch,
  hasRespondedToAttendance,
  getTeamPresentation,
  isLeagueMatch,
  getMatchLeagueId,
  getMatchTeamIds,
  canUserCancelMatch,
  canUserSubmitMatchScore,
  getMatchAttendanceAction,
  getMatchAttendanceActionWithTitle,
  getContextLabel,
  getIsMatchLoading,
  getMatchScores,
  getMatchVenuePresentation,
  getMatchToolbarVisibility,
  cancelMatch,
  submitMatchAttendance,
  openMatchVenueDirections,
  showMatchVenueDirectionsPrompt,
  showMatchAttendanceConfirm,
  showCancelMatchConfirm,
} from "@/utils/match-details";
import { MATCH_ATTENDANCE_ACTIONS } from "@/constants/match-details";
import type {
  MatchDetailsDisplayMatch,
  MatchTeamSummaryMap,
} from "@/types/match-details";
import type { TeamMatch, Venue } from "@/types/matches";
import { Alert, Linking } from "react-native";

const futureStartTime = new Date(
  Date.now() + 24 * 60 * 60 * 1000,
).toISOString();
const pastStartTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

type MatchWithUnknownScores = Omit<TeamMatch, "homeScore" | "awayScore"> & {
  homeScore?: unknown;
  awayScore?: unknown;
};

const baseMatch: TeamMatch = {
  id: "match-1",
  matchType: "TEAM_MATCH" as const,
  status: "CONFIRMED" as const,
  homeTeamId: "team-1",
  awayTeamId: "team-2",
  sport: "soccer",
  startTime: futureStartTime,
  endTime: futureStartTime,
  requiresReferee: false,
  createdByUserId: "user-1",
  createdAt: futureStartTime,
  updatedAt: futureStartTime,
};

const leagueMatch: MatchDetailsDisplayMatch & { leagueId: string } = {
  ...baseMatch,
  leagueId: "league-1",
};

describe("match-details utils", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("league/team id resolution helpers", () => {
    it("resolves direct and fallback league ids", () => {
      expect(
        getDirectLeagueMatchId({ space: "league", spaceId: "league-2" }),
      ).toBe("league-2");
      expect(
        getDirectLeagueMatchId({
          fallbackDisplayMatch: leagueMatch,
          space: "team",
          spaceId: "team-1",
        }),
      ).toBe("league-1");

      expect(
        getResolvedMatchLeagueId({
          displayMatch: leagueMatch,
          space: "team",
          spaceId: "team-1",
        }),
      ).toBe("league-1");
      expect(
        getResolvedMatchLeagueId({ space: "league", spaceId: "league-3" }),
      ).toBe("league-3");
      expect(
        getResolvedMatchLeagueId({ space: "team", spaceId: "team-1" }),
      ).toBe("");
    });

    it("returns team space id only in team space", () => {
      expect(getTeamSpaceId("team", "team-1")).toBe("team-1");
      expect(getTeamSpaceId("league", "team-1")).toBe("");
      expect(getTeamSpaceId(undefined, "team-1")).toBe("");
    });
  });

  describe("display and attendance derivation", () => {
    it("finds display match from the proper list based on space", () => {
      const teamListMatch = { ...baseMatch, id: "team-list-match" };
      const leagueListMatch = { ...leagueMatch, id: "league-list-match" };

      expect(
        getDisplayMatch({
          matchId: "team-list-match",
          space: "team",
          teamMatches: [teamListMatch],
        }),
      ).toEqual(teamListMatch);

      expect(
        getDisplayMatch({
          matchId: "league-list-match",
          space: "league",
          leagueMatches: [leagueListMatch],
        }),
      ).toEqual(leagueListMatch);
    });

    it("derives attendance response from role-specific persisted status", () => {
      expect(hasRespondedToAttendance({ hasSubmittedAttendance: true })).toBe(
        true,
      );
      expect(
        hasRespondedToAttendance({
          hasSubmittedAttendance: false,
          role: "REPLACEMENT",
          persistedAttendanceStatus: "CONFIRMED",
        }),
      ).toBe(true);
      expect(
        hasRespondedToAttendance({
          hasSubmittedAttendance: false,
          role: "PLAYER",
          persistedAttendanceStatus: "DECLINED",
        }),
      ).toBe(true);
      expect(
        hasRespondedToAttendance({
          hasSubmittedAttendance: false,
          role: "PLAYER",
          persistedAttendanceStatus: "PENDING",
        }),
      ).toBe(false);
    });
  });

  describe("presentation helpers", () => {
    it("builds team presentation from summary map with fallback defaults", () => {
      const teamSummaryMap: MatchTeamSummaryMap = {
        "team-1": {
          id: "team-1",
          name: "Home Team",
          logoUrl: "home-logo",
          ownerUserId: "owner-1",
        },
      };

      expect(
        getTeamPresentation({
          displayMatch: baseMatch,
          teamSummaryMap,
          awayName: " Away Trim ",
          awayLogoUrl: " away-logo ",
          homeName: " Home Trim ",
          homeLogoUrl: " home-fallback ",
        }),
      ).toEqual({
        awayTeamLogoUrl: "away-logo",
        awayTeamName: "Away Trim",
        homeTeamLogoUrl: "home-logo",
        homeTeamName: "Home Team",
      });
    });

    it("adds title to attendance action when an action exists", () => {
      expect(
        getMatchAttendanceActionWithTitle({
          awayTeamName: "Away",
          displayMatch: baseMatch,
          hasResponded: false,
          homeTeamName: "Home",
          isActiveMember: true,
          role: "PLAYER",
          space: "team",
          spaceId: "team-1",
        }),
      ).toMatchObject({
        ...MATCH_ATTENDANCE_ACTIONS.PLAYER,
        title: "Home vs Away",
      });

      expect(
        getMatchAttendanceActionWithTitle({
          awayTeamName: "Away",
          displayMatch: baseMatch,
          hasResponded: true,
          homeTeamName: "Home",
          isActiveMember: true,
          role: "PLAYER",
          space: "team",
          spaceId: "team-1",
        }),
      ).toBeNull();
    });

    it("builds venue presentation with and without coordinates", () => {
      const venue: Venue = {
        id: "venue-1",
        name: "Main Field",
        street: "123 Main St",
        city: "Halifax",
        region: "Halifax Regional Municipality",
        province: "NS",
        postalCode: "B3H 1Y6",
        country: "Canada",
        latitude: 44.65,
        longitude: -63.57,
        createdByUserId: "user-1",
        createdAt: futureStartTime,
        updatedAt: futureStartTime,
      };

      expect(
        getMatchVenuePresentation({ displayMatch: baseMatch, venue }),
      ).toEqual({
        hasCoordinates: true,
        hasVenue: true,
        mapRegion: {
          latitude: 44.65,
          longitude: -63.57,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        venueMetaLabel: "Main Field, Halifax, NS",
      });

      expect(
        getMatchVenuePresentation({
          displayMatch: { ...baseMatch, matchLocation: "Community Park" },
          venue: null,
        }),
      ).toEqual({
        hasCoordinates: false,
        hasVenue: true,
        mapRegion: undefined,
        venueMetaLabel: "Community Park",
      });
    });

    it("computes toolbar visibility combinations", () => {
      expect(
        getMatchToolbarVisibility({
          attendanceAction: null,
          canCancel: true,
          canSubmitScore: true,
          hasDisplayMatch: true,
          hasScore: false,
          isCancelled: false,
        }),
      ).toEqual({
        showAttendanceInMenu: false,
        showCancelInMenu: true,
        showMatchScoreInMenu: true,
        showMenu: true,
      });

      expect(
        getMatchToolbarVisibility({
          attendanceAction: null,
          canCancel: false,
          canSubmitScore: false,
          hasDisplayMatch: false,
          hasScore: true,
          isCancelled: true,
        }),
      ).toEqual({
        showAttendanceInMenu: false,
        showCancelInMenu: false,
        showMatchScoreInMenu: false,
        showMenu: false,
      });
    });
  });

  describe("isLeagueMatch", () => {
    it("returns true if match has leagueId", () => {
      expect(isLeagueMatch(leagueMatch)).toBe(true);
    });

    it("returns false if match is null or lacks leagueId", () => {
      expect(isLeagueMatch(baseMatch)).toBe(false);
      expect(isLeagueMatch(null)).toBe(false);
      expect(isLeagueMatch(undefined)).toBe(false);
    });
  });

  describe("getMatchLeagueId", () => {
    it("returns leagueId if present", () => {
      expect(getMatchLeagueId(leagueMatch)).toBe("league-1");
    });

    it("returns empty string if not a league match", () => {
      expect(getMatchLeagueId(baseMatch)).toBe("");
      expect(getMatchLeagueId(null)).toBe("");
    });
  });

  describe("getMatchTeamIds", () => {
    it("returns array of non-empty team IDs", () => {
      expect(getMatchTeamIds(baseMatch)).toEqual(["team-1", "team-2"]);
    });

    it("returns empty array if match is null", () => {
      expect(getMatchTeamIds(null)).toEqual([]);
    });

    it("filters out falsy team IDs", () => {
      expect(getMatchTeamIds({ ...baseMatch, awayTeamId: "" })).toEqual([
        "team-1",
      ]);
    });
  });

  describe("canUserCancelMatch", () => {
    const teamSummaryMap: MatchTeamSummaryMap = {
      "team-1": { id: "team-1", name: "Team 1", ownerUserId: "user-owner" },
      "team-2": { id: "team-2", name: "Team 2", ownerUserId: "other-owner" },
    };

    it("returns false if match is null or missing", () => {
      expect(
        canUserCancelMatch({ match: null, userId: "u1", isLeagueOwner: false }),
      ).toBe(false);
    });

    it("returns false if past match or cancelled", () => {
      expect(
        canUserCancelMatch({
          match: { ...baseMatch, startTime: pastStartTime },
          userId: "user-owner",
          isLeagueOwner: false,
          teamSummaryMap,
        }),
      ).toBe(false);

      expect(
        canUserCancelMatch({
          match: { ...baseMatch, status: "CANCELLED" },
          userId: "user-owner",
          isLeagueOwner: false,
          teamSummaryMap,
        }),
      ).toBe(false);
    });

    it("for league match: returns true only if isLeagueOwner", () => {
      expect(
        canUserCancelMatch({
          match: leagueMatch,
          userId: "random-user",
          isLeagueOwner: true,
        }),
      ).toBe(true);

      expect(
        canUserCancelMatch({
          match: leagueMatch,
          userId: "user-owner",
          isLeagueOwner: false,
          teamSummaryMap,
        }),
      ).toBe(false);
    });

    it("for team match: returns true if user is owner of home or away team", () => {
      expect(
        canUserCancelMatch({
          match: baseMatch,
          userId: "user-owner",
          isLeagueOwner: false,
          teamSummaryMap,
        }),
      ).toBe(true);

      expect(
        canUserCancelMatch({
          match: baseMatch,
          userId: "other-owner",
          isLeagueOwner: false,
          teamSummaryMap,
        }),
      ).toBe(true);

      expect(
        canUserCancelMatch({
          match: baseMatch,
          userId: "random-user",
          isLeagueOwner: false,
          teamSummaryMap,
        }),
      ).toBe(false);
    });
  });

  describe("canUserSubmitMatchScore", () => {
    const teamSummaryMap: MatchTeamSummaryMap = {
      "team-1": { id: "team-1", name: "Team 1", ownerUserId: "user-owner" },
    };

    it("returns false for invalid inputs, league matches, or unconfirmed matches", () => {
      expect(canUserSubmitMatchScore({ match: null, userId: "u1" })).toBe(
        false,
      );
      expect(canUserSubmitMatchScore({ match: baseMatch, userId: null })).toBe(
        false,
      );
      expect(
        canUserSubmitMatchScore({ match: leagueMatch, userId: "u1" }),
      ).toBe(false);
      expect(
        canUserSubmitMatchScore({
          match: { ...baseMatch, status: "PENDING_TEAM_ACCEPTANCE" },
          userId: "u1",
        }),
      ).toBe(false);
    });

    it("returns true if requiresReferee is true and user is the referee", () => {
      const refMatch = {
        ...baseMatch,
        requiresReferee: true,
        refereeUserId: "ref-user",
      };
      expect(
        canUserSubmitMatchScore({ match: refMatch, userId: "ref-user" }),
      ).toBe(true);
      expect(
        canUserSubmitMatchScore({
          match: refMatch,
          userId: "user-owner",
          teamSummaryMap,
        }),
      ).toBe(false);
    });

    it("returns true if user is team owner for non-refereed match", () => {
      expect(
        canUserSubmitMatchScore({
          match: baseMatch,
          userId: "user-owner",
          teamSummaryMap,
        }),
      ).toBe(true);
      expect(
        canUserSubmitMatchScore({
          match: baseMatch,
          userId: "random",
          teamSummaryMap,
        }),
      ).toBe(false);
    });
  });

  describe("getMatchAttendanceAction", () => {
    it("returns not attending for active players in team space", () => {
      expect(
        getMatchAttendanceAction({
          match: baseMatch,
          space: "team",
          spaceId: "team-1",
          role: "PLAYER",
          isActiveMember: true,
          hasResponded: false,
        }),
      ).toMatchObject({
        attending: "DECLINED",
        label: "Not Attending",
      });
    });

    it("returns attending for replacements only when their status is pending", () => {
      expect(
        getMatchAttendanceAction({
          match: baseMatch,
          space: "team",
          spaceId: "team-1",
          role: "REPLACEMENT",
          isActiveMember: true,
          hasResponded: false,
          attendanceStatus: "PENDING",
        }),
      ).toMatchObject({
        attending: "CONFIRMED",
        label: "Attending",
      });
    });

    it("returns null for replacements without a pending match-member row", () => {
      expect(
        getMatchAttendanceAction({
          match: baseMatch,
          space: "team",
          spaceId: "team-1",
          role: "REPLACEMENT",
          isActiveMember: true,
          hasResponded: false,
          attendanceStatus: "CONFIRMED",
        }),
      ).toBeNull();

      expect(
        getMatchAttendanceAction({
          match: baseMatch,
          space: "team",
          spaceId: "team-1",
          role: "REPLACEMENT",
          isActiveMember: true,
          hasResponded: false,
          attendanceStatus: undefined,
        }),
      ).toBeNull();
    });

    it("returns null for missing inputs or invalid spaces", () => {
      expect(
        getMatchAttendanceAction({
          match: null,
          space: "team",
          spaceId: "team-1",
          role: "PLAYER",
          isActiveMember: true,
          hasResponded: false,
        }),
      ).toBeNull();
      expect(
        getMatchAttendanceAction({
          match: baseMatch,
          space: "league",
          spaceId: "team-1",
          role: "PLAYER",
          isActiveMember: true,
          hasResponded: false,
        }),
      ).toBeNull();
      expect(
        getMatchAttendanceAction({
          match: baseMatch,
          space: "team",
          spaceId: undefined,
          role: "PLAYER",
          isActiveMember: true,
          hasResponded: false,
        }),
      ).toBeNull();
      expect(
        getMatchAttendanceAction({
          match: baseMatch,
          space: "team",
          spaceId: "team-1",
          role: "PLAYER",
          isActiveMember: false,
          hasResponded: false,
        }),
      ).toBeNull();
      expect(
        getMatchAttendanceAction({
          match: baseMatch,
          space: "team",
          spaceId: "team-1",
          role: "PLAYER",
          isActiveMember: true,
          hasResponded: true,
        }),
      ).toBeNull();
    });

    it("returns null if match is cancelled or in the past", () => {
      expect(
        getMatchAttendanceAction({
          match: { ...baseMatch, startTime: pastStartTime },
          space: "team",
          spaceId: "team-1",
          role: "PLAYER",
          isActiveMember: true,
          hasResponded: false,
        }),
      ).toBeNull();
      expect(
        getMatchAttendanceAction({
          match: { ...baseMatch, status: "CANCELLED" },
          space: "team",
          spaceId: "team-1",
          role: "PLAYER",
          isActiveMember: true,
          hasResponded: false,
        }),
      ).toBeNull();
    });
  });

  describe("getContextLabel", () => {
    it("returns league name if space is league", () => {
      expect(
        getContextLabel({ space: "league", leagueName: "Pro League" }),
      ).toBe("Pro League");
      expect(getContextLabel({ space: "league" })).toBe("League Match");
    });

    it("returns match league name if present for non-league spaces", () => {
      expect(
        getContextLabel({ space: "team", matchLeagueName: "Fun League" }),
      ).toBe("Fun League");
    });

    it("falls back to default team label", () => {
      expect(getContextLabel({ space: "team" })).toBe("Team Match");
      expect(getContextLabel({})).toBe("Team Match");
    });
  });

  describe("getIsMatchLoading", () => {
    it("returns leagueMatchesLoading when space is league", () => {
      expect(
        getIsMatchLoading({
          space: "league",
          leagueMatchLoading: false,
          leagueMatchesLoading: true,
          directMatchLoading: false,
          teamMatchesLoading: false,
        }),
      ).toBe(true);
    });

    it("returns true if either direct or team match loading when space is team", () => {
      expect(
        getIsMatchLoading({
          space: "team",
          leagueMatchLoading: false,
          leagueMatchesLoading: false,
          directMatchLoading: true,
          teamMatchesLoading: false,
        }),
      ).toBe(true);
      expect(
        getIsMatchLoading({
          space: "team",
          leagueMatchLoading: false,
          leagueMatchesLoading: false,
          directMatchLoading: false,
          teamMatchesLoading: true,
        }),
      ).toBe(true);
      expect(
        getIsMatchLoading({
          space: "team",
          leagueMatchLoading: false,
          leagueMatchesLoading: false,
          directMatchLoading: false,
          teamMatchesLoading: false,
        }),
      ).toBe(false);
    });

    it("returns directMatchLoading otherwise", () => {
      expect(
        getIsMatchLoading({
          leagueMatchLoading: false,
          leagueMatchesLoading: false,
          directMatchLoading: true,
          teamMatchesLoading: false,
        }),
      ).toBe(true);
    });
  });

  describe("getMatchScores", () => {
    it("returns empty object if match is null", () => {
      expect(getMatchScores(null)).toEqual({});
    });

    it("returns un-normalized scores if present", () => {
      expect(
        getMatchScores({ ...baseMatch, homeScore: 3, awayScore: 1 }),
      ).toEqual({ homeScore: 3, awayScore: 1 });
    });

    it("preserves null scores while pruning undefined/invalid", () => {
      expect(
        getMatchScores({ ...baseMatch, homeScore: null, awayScore: null }),
      ).toEqual({ homeScore: null, awayScore: null });
      expect(
        getMatchScores({
          ...baseMatch,
          homeScore: "invalidT",
          awayScore: undefined,
        } as unknown as MatchWithUnknownScores as MatchDetailsDisplayMatch),
      ).toEqual({ homeScore: undefined, awayScore: undefined });
    });
  });

  describe("async actions and prompts", () => {
    it("cancels league and team matches with expected invalidations", async () => {
      const invalidateQueries = jest.fn().mockResolvedValue(undefined);
      const cancelLeagueMatch = jest.fn().mockResolvedValue(undefined);
      const cancelTeamMatch = jest.fn().mockResolvedValue(undefined);
      const queryClient = { invalidateQueries } as unknown as {
        invalidateQueries: (args: unknown) => Promise<unknown>;
      };

      await cancelMatch({
        canCancel: true,
        cancelLeagueMatch,
        cancelTeamMatch,
        displayMatch: leagueMatch,
        leagueId: "league-1",
        queryClient: queryClient as never,
        space: "team",
        spaceId: "team-1",
      });

      expect(cancelLeagueMatch).toHaveBeenCalledWith({ matchId: "match-1" });
      expect(cancelTeamMatch).not.toHaveBeenCalled();
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["league-matches", "league-1"],
      });
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["team-matches", "team-1"],
      });

      invalidateQueries.mockClear();
      cancelLeagueMatch.mockClear();

      await cancelMatch({
        canCancel: true,
        cancelLeagueMatch,
        cancelTeamMatch,
        displayMatch: baseMatch,
        leagueId: "league-1",
        queryClient: queryClient as never,
        space: "team",
        spaceId: "team-1",
      });

      expect(cancelTeamMatch).toHaveBeenCalledWith({ matchId: "match-1" });
      expect(cancelLeagueMatch).not.toHaveBeenCalled();
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["team-match", "match-1"],
      });
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["team-matches", "team-1"],
      });
    });

    it("submits attendance and invalidates match members", async () => {
      const updateAttendance = jest.fn().mockResolvedValue(undefined);
      const setHasSubmittedAttendance = jest.fn();
      const invalidateQueries = jest.fn().mockResolvedValue(undefined);
      const queryClient = { invalidateQueries } as unknown as {
        invalidateQueries: (args: unknown) => Promise<unknown>;
      };

      await submitMatchAttendance({
        attendanceAction: MATCH_ATTENDANCE_ACTIONS.PLAYER,
        displayMatch: baseMatch,
        queryClient: queryClient as never,
        setHasSubmittedAttendance,
        spaceId: "team-1",
        updateAttendance,
      });

      expect(updateAttendance).toHaveBeenCalledWith({
        matchId: "match-1",
        attending: "DECLINED",
      });
      expect(setHasSubmittedAttendance).toHaveBeenCalledWith(true);
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["match-members-by-team", "match-1", "team-1"],
      });
    });

    it("opens maps when available and alerts when unavailable", async () => {
      const canOpenURLSpy = jest.spyOn(Linking, "canOpenURL");
      const openURLSpy = jest
        .spyOn(Linking, "openURL")
        .mockResolvedValue(undefined);
      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation(() => undefined);

      canOpenURLSpy.mockResolvedValueOnce(true);
      await openMatchVenueDirections({
        hasCoordinates: true,
        venue: {
          id: "venue-1",
          name: "Main Field",
          street: "123 Main St",
          city: "Halifax",
          region: "Halifax Regional Municipality",
          province: "NS",
          postalCode: "B3H 1Y6",
          country: "Canada",
          latitude: 10,
          longitude: 20,
          createdByUserId: "user-1",
          createdAt: futureStartTime,
          updatedAt: futureStartTime,
        } as Venue,
      });
      expect(openURLSpy).toHaveBeenCalledWith(
        "https://maps.apple.com/?daddr=10,20&q=Main%20Field",
      );

      canOpenURLSpy.mockResolvedValueOnce(false);
      await openMatchVenueDirections({
        hasCoordinates: false,
        matchLocation: "Community Park",
      });
      expect(alertSpy).toHaveBeenCalledWith(
        "Maps unavailable",
        "Could not open Apple Maps for directions on this device.",
      );
    });

    it("shows attendance and cancel confirmation prompts", () => {
      const alertSpy = jest
        .spyOn(Alert, "alert")
        .mockImplementation(() => undefined);
      const onConfirm = jest.fn();

      showMatchVenueDirectionsPrompt({
        venueName: "Main Field",
        onOpen: jest.fn(),
      });
      showMatchAttendanceConfirm({
        attendanceAction: MATCH_ATTENDANCE_ACTIONS.PLAYER,
        onConfirm,
      });
      showCancelMatchConfirm(onConfirm);

      expect(alertSpy).toHaveBeenCalledTimes(3);
    });
  });
});
