import {
  isLeagueMatch,
  getMatchLeagueId,
  getMatchTeamIds,
  canUserCancelMatch,
  canUserSubmitMatchScore,
  getMatchAttendanceAction,
  getContextLabel,
  getIsMatchLoading,
  getMatchScores,
} from "@/utils/match-details";

const futureStartTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const pastStartTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const baseMatch = {
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

const leagueMatch = {
  ...baseMatch,
  matchType: "LEAGUE_MATCH" as const,
  leagueId: "league-1",
};

describe("match-details utils", () => {
  describe("isLeagueMatch", () => {
    it("returns true if match has leagueId", () => {
      expect(isLeagueMatch(leagueMatch as any)).toBe(true);
    });

    it("returns false if match is null or lacks leagueId", () => {
      expect(isLeagueMatch(baseMatch)).toBe(false);
      expect(isLeagueMatch(null)).toBe(false);
      expect(isLeagueMatch(undefined)).toBe(false);
    });
  });

  describe("getMatchLeagueId", () => {
    it("returns leagueId if present", () => {
      expect(getMatchLeagueId(leagueMatch as any)).toBe("league-1");
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
      expect(getMatchTeamIds({ ...baseMatch, awayTeamId: "" })).toEqual(["team-1"]);
    });
  });

  describe("canUserCancelMatch", () => {
    const teamSummaryMap = {
      "team-1": { ownerUserId: "user-owner" } as any,
      "team-2": { ownerUserId: "other-owner" } as any,
    };

    it("returns false if match is null or missing", () => {
      expect(canUserCancelMatch({ match: null, userId: "u1", isLeagueOwner: false })).toBe(false);
    });

    it("returns false if past match or cancelled", () => {
      expect(canUserCancelMatch({
        match: { ...baseMatch, startTime: pastStartTime },
        userId: "user-owner",
        isLeagueOwner: false,
        teamSummaryMap,
      })).toBe(false);

      expect(canUserCancelMatch({
        match: { ...baseMatch, status: "CANCELLED" as any },
        userId: "user-owner",
        isLeagueOwner: false,
        teamSummaryMap,
      })).toBe(false);
    });

    it("for league match: returns true only if isLeagueOwner", () => {
      expect(canUserCancelMatch({
        match: leagueMatch as any,
        userId: "random-user",
        isLeagueOwner: true,
      })).toBe(true);

      expect(canUserCancelMatch({
        match: leagueMatch as any,
        userId: "user-owner",
        isLeagueOwner: false,
        teamSummaryMap,
      })).toBe(false);
    });

    it("for team match: returns true if user is owner of home or away team", () => {
      expect(canUserCancelMatch({
        match: baseMatch,
        userId: "user-owner",
        isLeagueOwner: false,
        teamSummaryMap,
      })).toBe(true);

      expect(canUserCancelMatch({
        match: baseMatch,
        userId: "other-owner",
        isLeagueOwner: false,
        teamSummaryMap,
      })).toBe(true);

      expect(canUserCancelMatch({
        match: baseMatch,
        userId: "random-user",
        isLeagueOwner: false,
        teamSummaryMap,
      })).toBe(false);
    });
  });

  describe("canUserSubmitMatchScore", () => {
    const teamSummaryMap = {
      "team-1": { ownerUserId: "user-owner" } as any,
    };

    it("returns false for invalid inputs, league matches, or unconfirmed matches", () => {
      expect(canUserSubmitMatchScore({ match: null, userId: "u1" })).toBe(false);
      expect(canUserSubmitMatchScore({ match: baseMatch, userId: null })).toBe(false);
      expect(canUserSubmitMatchScore({ match: leagueMatch as any, userId: "u1" })).toBe(false);
      expect(canUserSubmitMatchScore({ match: { ...baseMatch, status: "PENDING" as any }, userId: "u1" })).toBe(false);
    });

    it("returns true if requiresReferee is true and user is the referee", () => {
      const refMatch = { ...baseMatch, requiresReferee: true, refereeUserId: "ref-user" };
      expect(canUserSubmitMatchScore({ match: refMatch, userId: "ref-user" })).toBe(true);
      expect(canUserSubmitMatchScore({ match: refMatch, userId: "user-owner", teamSummaryMap })).toBe(false);
    });

    it("returns true if user is team owner for non-refereed match", () => {
      expect(canUserSubmitMatchScore({ match: baseMatch, userId: "user-owner", teamSummaryMap })).toBe(true);
      expect(canUserSubmitMatchScore({ match: baseMatch, userId: "random", teamSummaryMap })).toBe(false);
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
      expect(getMatchAttendanceAction({ match: null, space: "team", spaceId: "team-1", role: "PLAYER", isActiveMember: true, hasResponded: false })).toBeNull();
      expect(getMatchAttendanceAction({ match: baseMatch, space: "league", spaceId: "team-1", role: "PLAYER", isActiveMember: true, hasResponded: false })).toBeNull();
      expect(getMatchAttendanceAction({ match: baseMatch, space: "team", spaceId: undefined, role: "PLAYER", isActiveMember: true, hasResponded: false })).toBeNull();
      expect(getMatchAttendanceAction({ match: baseMatch, space: "team", spaceId: "team-1", role: "PLAYER", isActiveMember: false, hasResponded: false })).toBeNull();
      expect(getMatchAttendanceAction({ match: baseMatch, space: "team", spaceId: "team-1", role: "PLAYER", isActiveMember: true, hasResponded: true })).toBeNull();
    });

    it("returns null if match is cancelled or in the past", () => {
      expect(getMatchAttendanceAction({ match: { ...baseMatch, startTime: pastStartTime }, space: "team", spaceId: "team-1", role: "PLAYER", isActiveMember: true, hasResponded: false })).toBeNull();
      expect(getMatchAttendanceAction({ match: { ...baseMatch, status: "CANCELLED" as any }, space: "team", spaceId: "team-1", role: "PLAYER", isActiveMember: true, hasResponded: false })).toBeNull();
    });
  });

  describe("getContextLabel", () => {
    it("returns league name if space is league", () => {
      expect(getContextLabel({ space: "league", leagueName: "Pro League" })).toBe("Pro League");
      expect(getContextLabel({ space: "league" })).toBe("League Match");
    });

    it("returns match league name if present for non-league spaces", () => {
      expect(getContextLabel({ space: "team", matchLeagueName: "Fun League" })).toBe("Fun League");
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
      expect(getMatchScores({ ...baseMatch, homeScore: 3, awayScore: 1 } as any)).toEqual({ homeScore: 3, awayScore: 1 });
    });

    it("preserves null scores while pruning undefined/invalid", () => {
      expect(getMatchScores({ ...baseMatch, homeScore: null, awayScore: null } as any)).toEqual({ homeScore: null, awayScore: null });
      expect(getMatchScores({ ...baseMatch, homeScore: "invalidT" as any, awayScore: undefined } as any)).toEqual({ homeScore: undefined, awayScore: undefined });
    });
  });
});
