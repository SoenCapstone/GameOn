import { QueryClient } from "@tanstack/react-query";
import { AxiosInstance } from "axios";
import {
  notificationCopy,
  userNotificationsQueryKey,
} from "@/constants/notifications";
import { GO_TEAM_SERVICE_ROUTES } from "@/hooks/use-axios-clerk";
import {
  fetchIncomingRefereeInvites,
  fetchIncomingTeamMatchInvites,
} from "@/hooks/use-matches";
import {
  NotificationContent,
  NotificationItem,
  NotificationTeamMeta,
  TeamInviteCard,
  TeamInviteResponse,
} from "@/types/notifications";
import {
  fetchLeagueInvitesWithDetails,
  fetchOrganizerInvitesWithDetails,
} from "@/utils/leagues";
import { fetchUserNameMap } from "@/utils/users";

export function getNotificationsQueryKey(userId?: string | null) {
  return [userNotificationsQueryKey, userId] as const;
}

export async function fetchNotificationsWithDetails(
  api: AxiosInstance,
  userId: string,
): Promise<NotificationItem[]> {
  const [teamInvites, leagueInvites, organizerInvites, teamMatchInvites, refereeInvites] =
    await Promise.all([
      fetchTeamInvitesWithDetails(api).catch(() => []),
      fetchLeagueInvitesWithDetails(api).catch(() => []),
      fetchOrganizerInvitesWithDetails(api).catch(() => []),
      (userId
        ? fetchIncomingTeamMatchInvites(api, userId)
        : Promise.resolve([])
      ).catch(() => []),
      fetchIncomingRefereeInvites(api).catch(() => []),
    ]);

  return [
    ...teamInvites,
    ...leagueInvites,
    ...organizerInvites,
    ...teamMatchInvites,
    ...refereeInvites,
  ];
}

export async function fetchTeamInvitesWithDetails(
  api: AxiosInstance,
): Promise<TeamInviteCard[]> {
  const resp = await api.get<TeamInviteResponse[]>(
    GO_TEAM_SERVICE_ROUTES.USER_INVITES,
  );
  const invites = (resp.data ?? []).filter(
    (invite) => invite.status === "PENDING",
  );

  if (invites.length === 0) return [];

  const teamIds = Array.from(new Set(invites.map((invite) => invite.teamId)));
  const inviterIds = Array.from(
    new Set(invites.map((invite) => invite.invitedByUserId).filter(Boolean)),
  ) as string[];

  const [teamMap, inviterMap] = await Promise.all([
    fetchTeamMetaMap(api, teamIds),
    fetchUserNameMap(api, inviterIds),
  ]);

  return invites.map((invite) => ({
    kind: "team" as const,
    id: invite.id,
    teamId: invite.teamId,
    teamName: teamMap[invite.teamId]?.name ?? notificationCopy.missingTeamName,
    inviterName: invite.invitedByUserId
      ? (inviterMap[invite.invitedByUserId] ??
        notificationCopy.missingInviterName)
      : undefined,
    logoUrl: teamMap[invite.teamId]?.logoUrl,
    sport: teamMap[invite.teamId]?.sport,
  }));
}

export function removeNotificationById(
  notifications: NotificationItem[],
  notificationId: string,
) {
  return notifications.filter(
    (notification) => notification.id !== notificationId,
  );
}

export function getInviteContent(
  notification: NotificationItem,
): NotificationContent {
  if (notification.kind === "team") {
    return {
      spaceName: notification.teamName,
      logoUrl: notification.logoUrl,
      sport: notification.sport,
      body: `You received an invite${
        notification.inviterName ? ` from ${notification.inviterName}` : ""
      } to join ${notification.teamName}.`,
    };
  }

  if (notification.kind === "team-match") {
    return {
      spaceName: notification.homeTeamName,
      logoUrl: notification.logoUrl,
      sport: notification.sport,
      body: `${notification.homeTeamName} invited ${notification.awayTeamName} to a team match.`,
    };
  }

  if (notification.kind === "referee-match") {
    return {
      spaceName: notification.homeTeamName,
      logoUrl: notification.logoUrl,
      sport: notification.sport,
      body: `You received an invitation to referee ${notification.homeTeamName} vs ${notification.awayTeamName}.`,
    };
  }

  if (notification.kind === "league-organizer") {
    return {
      spaceName: notification.leagueName,
      logoUrl: notification.logoUrl,
      sport: notification.sport,
      body: `You've been invited${
        notification.inviterName ? ` by ${notification.inviterName}` : ""
      } to be an organizer of ${notification.leagueName}.`,
    };
  }

  return {
    spaceName: notification.leagueName,
    logoUrl: notification.logoUrl,
    sport: notification.sport,
    body: `You received an invite to join ${notification.leagueName} with ${notification.teamName}.`,
  };
}

export function removeNotificationByMatch(
  notifications: NotificationItem[],
  kind: "team-match" | "referee-match",
  matchId: string,
) {
  return notifications.filter(
    (notification) =>
      !(notification.kind === kind && notification.matchId === matchId),
  );
}

export function setNotificationsQueryData(
  queryClient: QueryClient,
  userId: string | null | undefined,
  updater: (notifications: NotificationItem[]) => NotificationItem[],
) {
  queryClient.setQueryData<NotificationItem[]>(
    getNotificationsQueryKey(userId),
    (current = []) => updater(current),
  );
}

export async function invalidateNotificationQueries(
  queryClient: QueryClient,
  queryKeys: readonly (readonly string[])[],
) {
  await Promise.all(
    queryKeys.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [...queryKey] }),
    ),
  );
}

async function fetchTeamMetaMap(
  api: AxiosInstance,
  teamIds: string[],
): Promise<Record<string, NotificationTeamMeta>> {
  const entries = await Promise.all(
    teamIds.map(async (teamId) => {
      try {
        const resp = await api.get(`${GO_TEAM_SERVICE_ROUTES.ALL}/${teamId}`);
        return [
          teamId,
          {
            name: resp.data?.name ?? notificationCopy.missingTeamName,
            logoUrl: resp.data?.logoUrl ?? null,
            sport: resp.data?.sport ?? null,
          },
        ] as const;
      } catch {
        return [
          teamId,
          {
            name: notificationCopy.missingTeamName,
            logoUrl: null,
            sport: null,
          },
        ] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}
