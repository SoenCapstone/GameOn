import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { AxiosInstance } from "axios";
import { LeaguePrivacy } from "@/types/leagues";
import {
  GO_TEAM_SERVICE_ROUTES,
  GO_USER_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { NotificationItem, TeamInviteCard } from "@/types/notifications";
import * as notificationsUtils from "@/utils/notifications";
import { fetchLeagueInvitesWithDetails } from "@/utils/leagues";
import {
  fetchIncomingRefereeInvites,
  fetchIncomingTeamMatchInvites,
} from "@/hooks/use-matches";

const mockFetchLeagueInvitesWithDetails =
  fetchLeagueInvitesWithDetails as jest.MockedFunction<
    typeof fetchLeagueInvitesWithDetails
  >;
const mockFetchIncomingTeamMatchInvites =
  fetchIncomingTeamMatchInvites as jest.MockedFunction<
    typeof fetchIncomingTeamMatchInvites
  >;
const mockFetchIncomingRefereeInvites =
  fetchIncomingRefereeInvites as jest.MockedFunction<
    typeof fetchIncomingRefereeInvites
  >;

function asAxiosInstance(api: {
  get: (url: string) => Promise<unknown>;
}): AxiosInstance {
  return api as unknown as AxiosInstance;
}

jest.mock("@/utils/leagues", () => ({
  fetchLeagueInvitesWithDetails: jest.fn(),
}));

jest.mock("@/hooks/use-matches", () => ({
  fetchIncomingRefereeInvites: jest.fn(),
  fetchIncomingTeamMatchInvites: jest.fn(),
}));

describe("notification utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds a scoped user notifications query key", () => {
    expect(notificationsUtils.getNotificationsQueryKey("user-1")).toEqual([
      "user-notifications",
      "user-1",
    ]);
  });

  it("builds a query key when user is missing", () => {
    expect(notificationsUtils.getNotificationsQueryKey(null)).toEqual([
      "user-notifications",
      null,
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

    expect(notificationsUtils.removeNotificationById(notifications, "invite-1")).toEqual([notifications[1]]);
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

    expect(notificationsUtils.removeNotificationByMatch(notifications, "team-match", "match-1")).toEqual([
      notifications[1],
    ]);
  });

  it("builds invite content for team notifications", () => {
    const content = notificationsUtils.getInviteContent({
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

  it("builds invite content for team-match, referee-match, and league notifications", () => {
    expect(
      notificationsUtils.getInviteContent({
        kind: "team-match",
        id: "match-invite-1",
        matchId: "match-1",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        homeTeamName: "Falcons",
        awayTeamName: "Wolves",
        startTime: "2026-04-03T10:00:00.000Z",
        logoUrl: "https://example.com/team.png",
        sport: "soccer",
      }).body,
    ).toBe("Falcons invited Wolves to a team match.");

    expect(
      notificationsUtils.getInviteContent({
        kind: "referee-match",
        id: "ref-invite-1",
        matchId: "match-2",
        homeTeamName: "Falcons",
        awayTeamName: "Tigers",
        startTime: "2026-04-03T10:00:00.000Z",
      }).body,
    ).toBe("You received an invitation to referee Falcons vs Tigers.");

    expect(
      notificationsUtils.getInviteContent({
        kind: "league",
        id: "league-invite-1",
        leagueId: "league-1",
        leagueName: "Premier League",
        teamId: "team-1",
        teamName: "Falcons",
        leaguePrivacy: LeaguePrivacy.PRIVATE,
      }).body,
    ).toBe("You received an invite to join Premier League with Falcons.");
  });

  it("fetches pending team invites and enriches team and inviter details", async () => {
    const api = asAxiosInstance({
      get: jest.fn(async (url: string) => {
        if (url === GO_TEAM_SERVICE_ROUTES.USER_INVITES) {
          return {
            data: [
              {
                id: "invite-1",
                teamId: "team-1",
                invitedByUserId: "user-1",
                status: "PENDING",
              },
              {
                id: "invite-2",
                teamId: "team-2",
                invitedByUserId: null,
                status: "ACCEPTED",
              },
            ],
          };
        }

        if (url === `${GO_TEAM_SERVICE_ROUTES.ALL}/team-1`) {
          return {
            data: {
              name: "Falcons",
              logoUrl: "https://example.com/team-1.png",
              sport: "soccer",
            },
          };
        }

        if (url === GO_USER_SERVICE_ROUTES.BY_ID("user-1")) {
          return { data: { firstname: "Alex", lastname: "Smith" } };
        }

        throw new Error(`Unexpected url: ${url}`);
      }),
    });

    await expect(notificationsUtils.fetchTeamInvitesWithDetails(api)).resolves.toEqual([
      {
        kind: "team",
        id: "invite-1",
        teamId: "team-1",
        teamName: "Falcons",
        inviterName: "Alex Smith",
        logoUrl: "https://example.com/team-1.png",
        sport: "soccer",
      },
    ]);
  });

  it("falls back to safe values when team or inviter metadata lookups fail", async () => {
    const api = asAxiosInstance({
      get: jest.fn(async (url: string) => {
        if (url === GO_TEAM_SERVICE_ROUTES.USER_INVITES) {
          return {
            data: [
              {
                id: "invite-1",
                teamId: "team-1",
                invitedByUserId: "user-1",
                status: "PENDING",
              },
            ],
          };
        }

        if (
          url === `${GO_TEAM_SERVICE_ROUTES.ALL}/team-1` ||
          url === GO_USER_SERVICE_ROUTES.BY_ID("user-1")
        ) {
          throw new Error("lookup failed");
        }

        throw new Error(`Unexpected url: ${url}`);
      }),
    });

    await expect(notificationsUtils.fetchTeamInvitesWithDetails(api)).resolves.toEqual([
      {
        kind: "team",
        id: "invite-1",
        teamId: "team-1",
        teamName: "Team",
        inviterName: "Someone",
        logoUrl: null,
        sport: null,
      },
    ]);
  });

  it("returns notifications from all sources and skips team-match fetch without user id", async () => {
    const api = asAxiosInstance({
      get: jest.fn(async () => {
        throw new Error("unexpected direct team invite fetch");
      }),
    });

    jest.spyOn(notificationsUtils, "fetchTeamInvitesWithDetails").mockResolvedValue([
      {
        kind: "team",
        id: "team-invite-1",
        teamId: "team-1",
        teamName: "Falcons",
      },
    ] as TeamInviteCard[]);

    mockFetchLeagueInvitesWithDetails.mockResolvedValue([
      {
        kind: "league",
        id: "league-invite-1",
        leagueId: "league-1",
        leagueName: "Premier",
        teamId: "team-1",
        teamName: "Falcons",
        leaguePrivacy: LeaguePrivacy.PRIVATE,
      },
    ]);
    mockFetchIncomingTeamMatchInvites.mockResolvedValue([
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
    ]);
    mockFetchIncomingRefereeInvites.mockResolvedValue([
      {
        kind: "referee-match",
        id: "ref-match-1",
        matchId: "match-1",
        homeTeamName: "Falcons",
        awayTeamName: "Wolves",
        startTime: "2026-04-03T10:00:00.000Z",
      },
    ]);

    const resultWithoutUser = await notificationsUtils.fetchNotificationsWithDetails(
      api,
      "",
    );
    expect(fetchIncomingTeamMatchInvites).not.toHaveBeenCalled();
    expect(resultWithoutUser).toHaveLength(2);

    const resultWithUser = await notificationsUtils.fetchNotificationsWithDetails(
      api,
      "user-1",
    );
    expect(fetchIncomingTeamMatchInvites).toHaveBeenCalledWith(api, "user-1");
    expect(resultWithUser).toHaveLength(3);
  });

  it("keeps returning available notifications when one source fails", async () => {
    const api = asAxiosInstance({
      get: jest.fn(async () => {
        throw new Error("team source unavailable");
      }),
    });

    jest.spyOn(notificationsUtils, "fetchTeamInvitesWithDetails").mockRejectedValue(
      new Error("team source unavailable"),
    );
    mockFetchLeagueInvitesWithDetails.mockResolvedValue([]);
    mockFetchIncomingTeamMatchInvites.mockResolvedValue([]);
    mockFetchIncomingRefereeInvites.mockResolvedValue([
      {
        kind: "referee-match",
        id: "ref-match-1",
        matchId: "match-1",
        homeTeamName: "Falcons",
        awayTeamName: "Wolves",
        startTime: "2026-04-03T10:00:00.000Z",
      },
    ]);

    await expect(
      notificationsUtils.fetchNotificationsWithDetails(api, "user-1"),
    ).resolves.toEqual([
      {
        kind: "referee-match",
        id: "ref-match-1",
        matchId: "match-1",
        homeTeamName: "Falcons",
        awayTeamName: "Wolves",
        startTime: "2026-04-03T10:00:00.000Z",
      },
    ]);
  });

  it("falls back to empty team-match invites when team-match fetch fails for a user", async () => {
    const api = asAxiosInstance({
      get: jest.fn(async () => {
        throw new Error("team source unavailable");
      }),
    });

    mockFetchLeagueInvitesWithDetails.mockResolvedValue([]);
    mockFetchIncomingTeamMatchInvites.mockRejectedValue(
      new Error("team matches unavailable"),
    );
    mockFetchIncomingRefereeInvites.mockResolvedValue([
      {
        kind: "referee-match",
        id: "ref-match-1",
        matchId: "match-1",
        homeTeamName: "Falcons",
        awayTeamName: "Wolves",
        startTime: "2026-04-03T10:00:00.000Z",
      },
    ]);

    await expect(
      notificationsUtils.fetchNotificationsWithDetails(api, "user-1"),
    ).resolves.toEqual([
      {
        kind: "referee-match",
        id: "ref-match-1",
        matchId: "match-1",
        homeTeamName: "Falcons",
        awayTeamName: "Wolves",
        startTime: "2026-04-03T10:00:00.000Z",
      },
    ]);

    expect(mockFetchIncomingTeamMatchInvites).toHaveBeenCalledWith(api, "user-1");
  });

  it("falls back to empty arrays when league and referee invite sources fail", async () => {
    const api = asAxiosInstance({
      get: jest.fn(async (url: string) => {
        if (url === GO_TEAM_SERVICE_ROUTES.USER_INVITES) {
          return { data: [] };
        }

        throw new Error(`Unexpected url: ${url}`);
      }),
    });

    mockFetchLeagueInvitesWithDetails.mockRejectedValue(
      new Error("league source unavailable"),
    );
    mockFetchIncomingTeamMatchInvites.mockResolvedValue([]);
    mockFetchIncomingRefereeInvites.mockRejectedValue(
      new Error("referee source unavailable"),
    );

    await expect(
      notificationsUtils.fetchNotificationsWithDetails(api, "user-1"),
    ).resolves.toEqual([]);
  });

  it("updates cached notifications through the query client helper", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(notificationsUtils.getNotificationsQueryKey("user-1"), [
      {
        kind: "team",
        id: "invite-1",
        teamId: "team-1",
        teamName: "Falcons",
      },
    ]);

    notificationsUtils.setNotificationsQueryData(
      queryClient,
      "user-1",
      (current) => notificationsUtils.removeNotificationById(current, "invite-1"),
    );

    expect(
      queryClient.getQueryData(notificationsUtils.getNotificationsQueryKey("user-1")),
    ).toEqual([]);

    queryClient.clear();
  });

  it("invalidates all provided query keys", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = jest
      .spyOn(queryClient, "invalidateQueries")
      .mockImplementation(async () => {
        return;
      });

    await notificationsUtils.invalidateNotificationQueries(queryClient, [
      ["user-notifications"],
      ["matches", "incoming"],
    ]);

    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: ["user-notifications"],
    });
    expect(invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: ["matches", "incoming"],
    });
  });
});
