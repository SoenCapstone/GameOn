import { LeaguePrivacy } from "@/types/leagues";
import {
  getInviteContent,
  getNotificationsQueryKey,
  removeNotificationById,
  removeNotificationByMatch,
} from "@/utils/notifications";
import { NotificationItem } from "@/types/notifications";

jest.mock("@/utils/leagues", () => ({
  fetchLeagueInvitesWithDetails: jest.fn(),
}));

jest.mock("@/hooks/use-matches", () => ({
  fetchIncomingRefereeInvites: jest.fn(),
  fetchIncomingTeamMatchInvites: jest.fn(),
}));

describe("notification utilities", () => {
  it("builds a scoped user notifications query key", () => {
    expect(getNotificationsQueryKey("user-1")).toEqual([
      "user-notifications",
      "user-1",
    ]);
  });

  it("removes invitation notifications by id", () => {
    const notifications: NotificationItem[] = [
      {
        kind: "team",
        id: "invite-1",
        teamId: "team-1",
        teamName: "Falcons",
      },
      {
        kind: "league",
        id: "invite-2",
        leagueId: "league-1",
        leagueName: "Premier",
        teamId: "team-2",
        teamName: "Wolves",
        leaguePrivacy: LeaguePrivacy.PRIVATE,
      },
    ];

    expect(removeNotificationById(notifications, "invite-1")).toEqual([
      notifications[1],
    ]);
  });

  it("removes match notifications by kind and match id", () => {
    const notifications: NotificationItem[] = [
      {
        kind: "team-match",
        id: "team-match-1",
        matchId: "match-1",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        homeTeamName: "Falcons",
        awayTeamName: "Wolves",
        startTime: "2026-04-03T10:00:00.000Z",
      },
      {
        kind: "referee-match",
        id: "ref-match-1",
        matchId: "match-1",
        homeTeamName: "Falcons",
        awayTeamName: "Wolves",
        startTime: "2026-04-03T10:00:00.000Z",
      },
    ];

    expect(
      removeNotificationByMatch(notifications, "team-match", "match-1"),
    ).toEqual([notifications[1]]);
  });

  it("builds invite content for team notifications", () => {
    const content = getInviteContent({
      kind: "team",
      id: "invite-1",
      teamId: "team-1",
      teamName: "Falcons",
      inviterName: "Alex",
      logoUrl: "https://example.com/logo.png",
      sport: "soccer",
    });

    expect(content).toEqual({
      spaceName: "Falcons",
      logoUrl: "https://example.com/logo.png",
      sport: "soccer",
      body: "You received an invite from Alex to join Falcons.",
    });
  });
});
