import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  leagueNotificationInvalidationKeys,
  notificationCopy,
  teamMatchNotificationInvalidationKeys,
  teamNotificationInvalidationKeys,
} from "@/constants/notifications";
import {
  GO_INVITE_ROUTES,
  GO_LEAGUE_INVITE_ROUTES,
  GO_MATCH_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import {
  InvitationResponsePayload,
  MatchInvitationResponsePayload,
  NotificationItem,
  NotificationResponse,
} from "@/types/notifications";
import { errorToString } from "@/utils/error";
import {
  fetchNotificationsWithDetails,
  getNotificationsQueryKey,
  invalidateNotificationQueries,
  removeNotificationById,
  removeNotificationByMatch,
  setNotificationsQueryData,
} from "@/utils/notifications";
import { getScheduleApiErrorMessage } from "@/utils/schedule-errors";
import { ScheduleConflictCode } from "@/types/matches";

function useNotificationsQuery<TData = NotificationItem[]>(
  options?: Omit<
    UseQueryOptions<NotificationItem[], Error, TData>,
    "queryKey" | "queryFn" | "enabled"
  >,
) {
  const api = useAxiosWithClerk();
  const { userId } = useAuth();

  return useQuery<NotificationItem[], Error, TData>({
    queryKey: getNotificationsQueryKey(userId),
    queryFn: async () => fetchNotificationsWithDetails(api, userId ?? ""),
    enabled: Boolean(userId),
    ...options,
  });
}

export function useNotifications() {
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useNotificationsQuery();

  const handleInviteResponseError = useCallback((err: unknown) => {
    Alert.alert(notificationCopy.actionFailedTitle, errorToString(err));
  }, []);

  const handleTeamMatchInviteResponseError = useCallback((err: unknown) => {
    const { message } = getScheduleApiErrorMessage(
      err as AxiosError<{
        message?: string;
        code?: ScheduleConflictCode | null;
      }>,
      "Only the invited team owner can respond to this match invite.",
    );
    Alert.alert(notificationCopy.matchActionFailedTitle, message);
  }, []);

  const handleInvitationSuccess = useCallback(
    async (
      variables: InvitationResponsePayload,
      args: {
        acceptedMessage: string;
        declinedMessage: string;
        invalidateKeys: readonly (readonly string[])[];
      },
    ) => {
      setNotificationsQueryData(queryClient, userId, (current) =>
        removeNotificationById(current, variables.invitationId),
      );
      await invalidateNotificationQueries(queryClient, args.invalidateKeys);
      Alert.alert(
        variables.isAccepted
          ? notificationCopy.inviteAcceptedTitle
          : notificationCopy.inviteDeclinedTitle,
        variables.isAccepted ? args.acceptedMessage : args.declinedMessage,
      );
    },
    [queryClient, userId],
  );

  const handleMatchInvitationSuccess = useCallback(
    async (
      variables: MatchInvitationResponsePayload,
      args: {
        kind: "team-match" | "referee-match";
        acceptedTitle?: string;
        declinedTitle?: string;
        acceptedMessage: string;
        declinedMessage: string;
        invalidateKeys?: readonly (readonly string[])[];
      },
    ) => {
      setNotificationsQueryData(queryClient, userId, (current) =>
        removeNotificationByMatch(current, args.kind, variables.matchId),
      );

      if (args.invalidateKeys) {
        await invalidateNotificationQueries(queryClient, args.invalidateKeys);
      }

      Alert.alert(
        variables.isAccepted
          ? (args.acceptedTitle ?? notificationCopy.inviteAcceptedTitle)
          : (args.declinedTitle ?? notificationCopy.inviteDeclinedTitle),
        variables.isAccepted ? args.acceptedMessage : args.declinedMessage,
      );
    },
    [queryClient, userId],
  );

  const respondToTeamInvite = useMutation({
    mutationFn: async (payload: InvitationResponsePayload) => {
      await api.post(GO_INVITE_ROUTES.RESPOND, payload);
    },
    onSuccess: async (_data, variables) => {
      await handleInvitationSuccess(variables, {
        acceptedMessage: notificationCopy.teamInviteAcceptedMessage,
        declinedMessage: notificationCopy.invitationDeclinedMessage,
        invalidateKeys: teamNotificationInvalidationKeys,
      });
    },
    onError: handleInviteResponseError,
  });

  const respondToLeagueInvite = useMutation({
    mutationFn: async (payload: InvitationResponsePayload) => {
      const endpoint = payload.isAccepted
        ? GO_LEAGUE_INVITE_ROUTES.ACCEPT(payload.invitationId)
        : GO_LEAGUE_INVITE_ROUTES.DECLINE(payload.invitationId);
      await api.post(endpoint);
    },
    onSuccess: async (_data, variables) => {
      await handleInvitationSuccess(variables, {
        acceptedMessage: notificationCopy.leagueInviteAcceptedMessage,
        declinedMessage: notificationCopy.invitationDeclinedMessage,
        invalidateKeys: leagueNotificationInvalidationKeys,
      });
    },
    onError: handleInviteResponseError,
  });

  const respondToTeamMatchInvite = useMutation({
    mutationFn: async (payload: MatchInvitationResponsePayload) => {
      const endpoint = payload.isAccepted
        ? GO_MATCH_ROUTES.ACCEPT_TEAM_INVITE(payload.matchId)
        : GO_MATCH_ROUTES.DECLINE_TEAM_INVITE(payload.matchId);
      await api.post(endpoint);
    },
    onSuccess: async (_data, variables) => {
      await handleMatchInvitationSuccess(variables, {
        kind: "team-match",
        acceptedTitle: notificationCopy.matchAcceptedTitle,
        declinedTitle: notificationCopy.matchDeclinedTitle,
        acceptedMessage: notificationCopy.teamMatchAcceptedMessage,
        declinedMessage: notificationCopy.teamMatchDeclinedMessage,
        invalidateKeys: teamMatchNotificationInvalidationKeys,
      });
    },
    onError: handleTeamMatchInviteResponseError,
  });

  const respondToRefereeInvite = useMutation({
    mutationFn: async (payload: MatchInvitationResponsePayload) => {
      const endpoint = payload.isAccepted
        ? GO_MATCH_ROUTES.ACCEPT_REF_INVITE(payload.matchId)
        : GO_MATCH_ROUTES.DECLINE_REF_INVITE(payload.matchId);
      await api.post(endpoint);
    },
    onSuccess: async (_data, variables) => {
      await handleMatchInvitationSuccess(variables, {
        kind: "referee-match",
        acceptedMessage: notificationCopy.refereeInviteAcceptedMessage,
        declinedMessage: notificationCopy.refereeInviteDeclinedMessage,
      });
    },
    onError: handleInviteResponseError,
  });

  const respond = useCallback(
    (notification: NotificationItem, response: NotificationResponse) => {
      const isAccepted = response === "accept";

      if (notification.kind === "team") {
        respondToTeamInvite.mutate({
          invitationId: notification.id,
          isAccepted,
        });
        return;
      }

      if (notification.kind === "league") {
        respondToLeagueInvite.mutate({
          invitationId: notification.id,
          isAccepted,
        });
        return;
      }

      if (notification.kind === "team-match") {
        respondToTeamMatchInvite.mutate({
          matchId: notification.matchId,
          isAccepted,
        });
        return;
      }

      respondToRefereeInvite.mutate({
        matchId: notification.matchId,
        isAccepted,
      });
    },
    [
      respondToLeagueInvite,
      respondToRefereeInvite,
      respondToTeamInvite,
      respondToTeamMatchInvite,
    ],
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  return {
    notifications,
    isLoading,
    isRefreshing,
    refresh,
    respond,
  };
}

export function useNotificationsCount() {
  const { data: count = null, isLoading } = useNotificationsQuery<
    number | null
  >({
    select: (notifications) =>
      notifications.length > 0 ? notifications.length : null,
  });

  return {
    count,
    isLoading,
  };
}
