import { getMatchAttendanceAction } from "@/utils/match-details";

const futureStartTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

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
});
