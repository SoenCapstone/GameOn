import { useCallback, useState } from "react";
import { ContentArea } from "@/components/ui/content-area";
import {
  View,
  RefreshControl,
  Alert,
  StyleSheet,
  Pressable,
} from "react-native";
import { AxiosInstance } from "axios";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GO_INVITE_ROUTES,
  GO_LEAGUE_INVITE_ROUTES,
  GO_MATCH_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
  GO_USER_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";
import { getScheduleApiErrorMessage } from "@/utils/schedule-errors";
import { ScheduleConflictCode } from "@/types/matches";
import { fetchLeagueInvitesWithDetails } from "@/utils/leagues";
import {
  fetchIncomingRefereeInvites,
  fetchIncomingTeamMatchInvites,
} from "@/hooks/use-matches";
import {
  InviteCard,
  InviteCardItem,
  TeamInviteCard,
} from "@/components/invite/card";
import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import { Image } from "expo-image";
import { Logo } from "@/components/header/logo";
import { Empty } from "@/components/ui/empty";
import { Loading } from "@/components/ui/loading";

type TeamInviteResponse = {
  id: string;
  teamId: string;
  invitedByUserId?: string | null;
  status?: string | null;
};

type TeamInviteMeta = {
  name: string;
  logoUrl?: string | null;
  sport?: string | null;
};

function HomeToolbar() {
  const { user } = useUser();
  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.View hidesSharedBackground>
          <Logo />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <Stack.Screen.Title>Home</Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        {user?.hasImage ? (
          <Stack.Toolbar.View>
            <Pressable onPress={() => router.push("/settings")}>
              <Image
                source={{ uri: user.imageUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            </Pressable>
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Button
            icon="gear"
            onPress={() => router.push("/settings")}
          />
        )}
      </Stack.Toolbar>
    </>
  );
}

export default function Home() {
  const [tab, setTab] = useState<"feed" | "following">("feed");
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const {
    data: invites = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<InviteCardItem[]>({
    queryKey: ["user-updates", userId],
    queryFn: async () => fetchUpdatesWithDetails(api, userId ?? ""),
    enabled: Boolean(userId),
  });

  const handleInviteResponseError = useCallback((err: unknown) => {
    Alert.alert("Action failed", errorToString(err));
  }, []);

  const handleTeamMatchInviteResponseError = useCallback((err: unknown) => {
    const { message } = getScheduleApiErrorMessage(
      err as import("axios").AxiosError<{
        message?: string;
        code?: ScheduleConflictCode | null;
      }>,
      "Only the invited team owner can respond to this match invite.",
    );
    Alert.alert("Match action failed", message);
  }, []);

  const handleInviteResponseSuccess = useCallback(
    (invalidateKeys: string[][], acceptedMessage: string) =>
      (
        _data: unknown,
        variables: { invitationId: string; isAccepted: boolean },
      ) => {
        const cacheKey = ["user-updates", userId];
        const currentInvites =
          queryClient.getQueryData<InviteCardItem[]>(cacheKey) ?? [];
        queryClient.setQueryData<InviteCardItem[]>(
          cacheKey,
          currentInvites.filter(
            (invite) => invite.id !== variables.invitationId,
          ),
        );
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        Alert.alert(
          variables.isAccepted ? "Invite accepted" : "Invite declined",
          variables.isAccepted
            ? acceptedMessage
            : "The invitation was declined.",
        );
      },
    [queryClient, userId],
  );

  const respondMutation = useMutation({
    mutationFn: async (payload: {
      invitationId: string;
      isAccepted: boolean;
    }) => {
      await api.post(GO_INVITE_ROUTES.RESPOND, payload);
    },
    onSuccess: handleInviteResponseSuccess(
      [
        ["teams"],
        ["team-members"],
        ["team-membership"],
        ["leagues"],
        ["league-memberships"],
      ],
      "You have joined the team.",
    ),
    onError: handleInviteResponseError,
  });

  const respondLeagueInviteMutation = useMutation({
    mutationFn: async (payload: {
      invitationId: string;
      isAccepted: boolean;
    }) => {
      const endpoint = payload.isAccepted
        ? GO_LEAGUE_INVITE_ROUTES.ACCEPT(payload.invitationId)
        : GO_LEAGUE_INVITE_ROUTES.DECLINE(payload.invitationId);
      await api.post(endpoint);
    },
    onSuccess: handleInviteResponseSuccess(
      [["leagues"], ["league-teams"], ["league-memberships"]],
      "The team has joined the league.",
    ),
    onError: handleInviteResponseError,
  });

  const respondTeamMatchInviteMutation = useMutation({
    mutationFn: async (payload: { matchId: string; isAccepted: boolean }) => {
      const endpoint = payload.isAccepted
        ? GO_MATCH_ROUTES.ACCEPT_TEAM_INVITE(payload.matchId)
        : GO_MATCH_ROUTES.DECLINE_TEAM_INVITE(payload.matchId);
      await api.post(endpoint);
    },
    onSuccess: async (_data, variables) => {
      const cacheKey = ["user-updates", userId];
      const currentInvites =
        queryClient.getQueryData<InviteCardItem[]>(cacheKey) ?? [];
      queryClient.setQueryData<InviteCardItem[]>(
        cacheKey,
        currentInvites.filter(
          (invite) =>
            !(
              invite.kind === "team-match" &&
              invite.matchId === variables.matchId
            ),
        ),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["team-matches"] }),
      ]);
      Alert.alert(
        variables.isAccepted ? "Match accepted" : "Match declined",
        variables.isAccepted
          ? "The team match invite was accepted."
          : "The team match invite was declined.",
      );
    },
    onError: handleTeamMatchInviteResponseError,
  });

  const respondRefereeInviteMutation = useMutation({
    mutationFn: async (payload: { matchId: string; isAccepted: boolean }) => {
      const endpoint = payload.isAccepted
        ? GO_MATCH_ROUTES.ACCEPT_REF_INVITE(payload.matchId)
        : GO_MATCH_ROUTES.DECLINE_REF_INVITE(payload.matchId);
      await api.post(endpoint);
    },
    onSuccess: async (_data, variables) => {
      const cacheKey = ["user-updates", userId];
      const currentInvites =
        queryClient.getQueryData<InviteCardItem[]>(cacheKey) ?? [];
      queryClient.setQueryData<InviteCardItem[]>(
        cacheKey,
        currentInvites.filter(
          (invite) =>
            !(
              invite.kind === "referee-match" &&
              invite.matchId === variables.matchId
            ),
        ),
      );
      Alert.alert(
        variables.isAccepted ? "Invite accepted" : "Invite declined",
        variables.isAccepted
          ? "You accepted the referee invitation."
          : "You declined the referee invitation.",
      );
    },
    onError: handleInviteResponseError,
  });

  const handleAccept = useCallback(
    (inviteId: string) => {
      respondMutation.mutate({ invitationId: inviteId, isAccepted: true });
    },
    [respondMutation],
  );

  const handleDeny = useCallback(
    (inviteId: string) => {
      respondMutation.mutate({ invitationId: inviteId, isAccepted: false });
    },
    [respondMutation],
  );

  const handleAcceptLeague = useCallback(
    (inviteId: string) => {
      const maybe = invites.find((i) => i.id === inviteId);
      if (maybe?.kind !== "league") {
        Alert.alert(
          "Missing league invite",
          "Could not find that league invite.",
        );
        return;
      }

      if (!maybe.leagueId) {
        Alert.alert(
          "Missing league info",
          "Could not find leagueId for this invite.",
        );
        return;
      }

      respondLeagueInviteMutation.mutate({
        invitationId: inviteId,
        isAccepted: true,
      });
    },
    [invites, respondLeagueInviteMutation],
  );

  const handleDenyLeague = useCallback(
    (inviteId: string) => {
      respondLeagueInviteMutation.mutate({
        invitationId: inviteId,
        isAccepted: false,
      });
    },
    [respondLeagueInviteMutation],
  );

  const onRefresh = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
  }, [refetch]);

  return (
    <ContentArea
      tabs={{
        values: ["Feed", "Following"],
        selectedIndex: tab === "feed" ? 0 : 1,
        onValueChange: (value) => {
          if (value === "Feed") setTab("feed");
          if (value === "Following") setTab("following");
        },
      }}
      toolbar={<HomeToolbar />}
      background={{ preset: "blue" }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
      }
    >
      {tab === "feed" ? (
        <View style={styles.cardWrap}>
          {isLoading ? (
            <Loading />
          ) : invites.length === 0 ? (
            <Empty message="No updates available" />
          ) : (
            invites.map((invite) => (
              <InviteCard
                key={invite.id}
                invite={invite}
                onAcceptTeam={handleAccept}
                onDeclineTeam={handleDeny}
                onAcceptLeague={handleAcceptLeague}
                onDeclineLeague={handleDenyLeague}
                onRespondTeamMatch={(matchId, isAccepted) =>
                  respondTeamMatchInviteMutation.mutate({ matchId, isAccepted })
                }
                onRespondRefereeMatch={(matchId, isAccepted) =>
                  respondRefereeInviteMutation.mutate({ matchId, isAccepted })
                }
              />
            ))
          )}
        </View>
      ) : (
        <Empty message="No updates available" />
      )}
    </ContentArea>
  );
}

async function fetchUpdatesWithDetails(api: AxiosInstance, userId: string) {
  const [teamInvites, leagueInvites, teamMatchInvites, refereeInvites] =
    await Promise.all([
      fetchTeamInvitesWithDetails(api).catch(() => []),
      fetchLeagueInvitesWithDetails(api).catch(() => []),
      (userId
        ? fetchIncomingTeamMatchInvites(api, userId)
        : Promise.resolve([])
      ).catch(() => []),
      fetchIncomingRefereeInvites(api).catch(() => []),
    ]);

  return [
    ...teamInvites,
    ...leagueInvites,
    ...teamMatchInvites,
    ...refereeInvites,
  ];
}

async function fetchTeamInvitesWithDetails(
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
    teamName: teamMap[invite.teamId]?.name ?? "Team",
    inviterName: invite.invitedByUserId
      ? (inviterMap[invite.invitedByUserId] ?? "Someone")
      : undefined,
    logoUrl: teamMap[invite.teamId]?.logoUrl,
    sport: teamMap[invite.teamId]?.sport,
  }));
}

async function fetchTeamMetaMap(
  api: AxiosInstance,
  teamIds: string[],
): Promise<Record<string, TeamInviteMeta>> {
  const entries = await Promise.all(
    teamIds.map(async (teamId) => {
      try {
        const resp = await api.get(`${GO_TEAM_SERVICE_ROUTES.ALL}/${teamId}`);
        return [
          teamId,
          {
            name: resp.data?.name ?? "Team",
            logoUrl: resp.data?.logoUrl ?? null,
            sport: resp.data?.sport ?? null,
          },
        ] as const;
      } catch {
        return [teamId, { name: "Team", logoUrl: null, sport: null }] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

async function fetchUserNameMap(api: AxiosInstance, userIds: string[]) {
  const entries = await Promise.all(
    userIds.map(async (userId) => {
      try {
        const resp = await api.get(GO_USER_SERVICE_ROUTES.BY_ID(userId));
        const first = resp.data?.firstname ?? "";
        const last = resp.data?.lastname ?? "";
        const full = `${first} ${last}`.trim();
        return [userId, full || resp.data?.email || "Someone"] as const;
      } catch {
        return [userId, "Someone"] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 100,
  },
  container: {
    alignItems: "center",
  },
  segmented: {
    marginBottom: 16,
    width: "90%",
  },
  cardWrap: {
    gap: 14,
  },
});
