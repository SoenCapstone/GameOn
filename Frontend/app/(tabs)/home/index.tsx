import { useCallback, useState } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { View, Text, RefreshControl, Alert, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ButtonItem } from "@/components/form/button-item";
import { AxiosInstance } from "axios";
import { useAuth } from "@clerk/clerk-expo";
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
import {
  fetchLeagueInvitesWithDetails,
  LeagueInviteCard,
} from "@/components/leagues/league-invite-utils";
import { RefereeMatchInviteCard, TeamMatchInviteCard } from "@/features/matches/types";
import {
  fetchIncomingRefereeInvites,
  fetchIncomingTeamMatchInvites,
} from "@/hooks/use-matches";
import { Tabs } from "@/components/ui/tabs";

const denyColor = "rgba(255,255,255,0.75)";

type TeamInviteCard = {
  kind: "team";
  id: string;
  teamName: string;
  inviterName?: string;
  teamId: string;
};

type InviteCard =
  | TeamInviteCard
  | LeagueInviteCard
  | TeamMatchInviteCard
  | RefereeMatchInviteCard;

function isLeagueInviteCard(invite: InviteCard): invite is LeagueInviteCard {
  return invite.kind === "league";
}

type TeamInviteResponse = {
  id: string;
  teamId: string;
  invitedByUserId?: string | null;
  status?: string | null;
};

export default function Home() {
  const [tab, setTab] = useState<"updates" | "following">("updates");
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const {
    data: invites = [],
    isFetching,
    refetch,
  } = useQuery<InviteCard[]>({
    queryKey: ["user-updates", userId],
    queryFn: async () => fetchUpdatesWithDetails(api, userId ?? ""),
    enabled: Boolean(userId),
  });

  const handleInviteResponseError = useCallback((err: unknown) => {
    Alert.alert("Action failed", errorToString(err));
  }, []);

  const handleInviteResponseSuccess = useCallback(
    (invalidateKeys: string[][], acceptedMessage: string) =>
      (
        _data: unknown,
        variables: { invitationId: string; isAccepted: boolean },
      ) => {
        const cacheKey = ["user-updates", userId];
        const currentInvites =
          queryClient.getQueryData<InviteCard[]>(cacheKey) ?? [];
        queryClient.setQueryData<InviteCard[]>(
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
      const currentInvites = queryClient.getQueryData<InviteCard[]>(cacheKey) ?? [];
      queryClient.setQueryData<InviteCard[]>(
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
        queryClient.invalidateQueries({ queryKey: ["user-updates", userId] }),
        queryClient.invalidateQueries({ queryKey: ["team-matches"] }),
      ]);
      Alert.alert(
        variables.isAccepted ? "Match accepted" : "Match declined",
        variables.isAccepted
          ? "The team match invite was accepted."
          : "The team match invite was declined.",
      );
    },
    onError: handleInviteResponseError,
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
      const currentInvites = queryClient.getQueryData<InviteCard[]>(cacheKey) ?? [];
      queryClient.setQueryData<InviteCard[]>(
        cacheKey,
        currentInvites.filter(
          (invite) =>
            !(
              invite.kind === "referee-match" &&
              invite.matchId === variables.matchId
            ),
        ),
      );
      await queryClient.invalidateQueries({ queryKey: ["user-updates", userId] });
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
      if (!maybe || !isLeagueInviteCard(maybe)) {
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
    await refetch();
  }, [refetch]);

  const renderInviteContent = useCallback(
    (invite: InviteCard) => {
      if (invite.kind === "team") {
        return (
          <>
            <Text style={styles.teamName}>{invite.teamName}</Text>
            <Text style={styles.inviteText}>
              You received an invite
              {invite.inviterName ? ` from ${invite.inviterName}` : ""} to join {invite.teamName}.
            </Text>
            <View style={styles.actionsRow}>
              <View style={styles.actionButton}>
                <ButtonItem button="Accept" onPress={() => handleAccept(invite.id)} />
              </View>
              <View style={styles.actionButton}>
                <ButtonItem button="Decline" color={denyColor} onPress={() => handleDeny(invite.id)} />
              </View>
            </View>
          </>
        );
      }

      if (invite.kind === "team-match") {
        return (
          <>
            <Text style={styles.teamName}>{invite.homeTeamName}</Text>
            <Text style={styles.inviteText}>
              Match invite from {invite.homeTeamName} for {invite.awayTeamName}.
            </Text>
            <View style={styles.actionsRow}>
              <View style={styles.actionButton}>
                <ButtonItem
                  button="Accept"
                  onPress={() =>
                    respondTeamMatchInviteMutation.mutate({
                      matchId: invite.matchId,
                      isAccepted: true,
                    })
                  }
                />
              </View>
              <View style={styles.actionButton}>
                <ButtonItem
                  button="Decline"
                  color={denyColor}
                  onPress={() =>
                    respondTeamMatchInviteMutation.mutate({
                      matchId: invite.matchId,
                      isAccepted: false,
                    })
                  }
                />
              </View>
            </View>
          </>
        );
      }

      if (invite.kind === "referee-match") {
        return (
          <>
            <Text style={styles.teamName}>
              {invite.homeTeamName} vs {invite.awayTeamName}
            </Text>
            <Text style={styles.inviteText}>
              You received a referee invitation for this team match.
            </Text>
            <View style={styles.actionsRow}>
              <View style={styles.actionButton}>
                <ButtonItem
                  button="Accept"
                  onPress={() =>
                    respondRefereeInviteMutation.mutate({
                      matchId: invite.matchId,
                      isAccepted: true,
                    })
                  }
                />
              </View>
              <View style={styles.actionButton}>
                <ButtonItem
                  button="Decline"
                  color={denyColor}
                  onPress={() =>
                    respondRefereeInviteMutation.mutate({
                      matchId: invite.matchId,
                      isAccepted: false,
                    })
                  }
                />
              </View>
            </View>
          </>
        );
      }

      return (
        <>
          <Text style={styles.teamName}>{invite.leagueName}</Text>
          <Text style={styles.inviteText}>
            You received an invite to join {invite.leagueName} with {invite.teamName}.
          </Text>
          <View style={styles.actionsRow}>
            <View style={styles.actionButton}>
              <ButtonItem button="Accept" onPress={() => handleAcceptLeague(invite.id)} />
            </View>
            <View style={styles.actionButton}>
              <ButtonItem button="Decline" color={denyColor} onPress={() => handleDenyLeague(invite.id)} />
            </View>
          </View>
        </>
      );
    },
    [
      handleAccept,
      handleAcceptLeague,
      handleDeny,
      handleDenyLeague,
      respondRefereeInviteMutation,
      respondTeamMatchInviteMutation,
    ],
  );

  return (
    <ContentArea
      scrollable
      tabs
      backgroundProps={{ preset: "blue" }}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={onRefresh}
          tintColor="#fff"
        />
      }
    >
      <Tabs
        values={["My Updates", "Following"]}
        selectedIndex={tab === "updates" ? 0 : 1}
        onValueChange={(value) => {
          if (value === "My Updates") setTab("updates");
          if (value === "Following") setTab("following");
        }}
      />

        {tab === "updates" ? (
          <View style={styles.cardWrap}>
            {invites.length === 0 ? (
              <Text style={styles.inviteText}>No pending invitations.</Text>
            ) : (
              invites.map((invite) => (
                <Card key={invite.id}>{renderInviteContent(invite)}</Card>
              ))
            )}
          </View>
        ) : (
          <View />
        )}
    </ContentArea>
  );
}

async function fetchUpdatesWithDetails(api: AxiosInstance, userId: string) {
  const [teamInvites, leagueInvites, teamMatchInvites, refereeInvites] =
    await Promise.all([
      fetchTeamInvitesWithDetails(api).catch(() => []),
      fetchLeagueInvitesWithDetails(api).catch(() => []),
      (userId ? fetchIncomingTeamMatchInvites(api, userId) : Promise.resolve([])).catch(
        () => [],
      ),
      fetchIncomingRefereeInvites(api).catch(() => []),
    ]);

  return [...teamInvites, ...leagueInvites, ...teamMatchInvites, ...refereeInvites];
}

async function fetchTeamInvitesWithDetails(api: AxiosInstance) {
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
    fetchTeamNameMap(api, teamIds),
    fetchUserNameMap(api, inviterIds),
  ]);

  return invites.map((invite) => ({
    kind: "team" as const,
    id: invite.id,
    teamId: invite.teamId,
    teamName: teamMap[invite.teamId] ?? "Team",
    inviterName: invite.invitedByUserId
      ? (inviterMap[invite.invitedByUserId] ?? "Someone")
      : undefined,
  }));
}

async function fetchTeamNameMap(api: AxiosInstance, teamIds: string[]) {
  const entries = await Promise.all(
    teamIds.map(async (teamId) => {
      try {
        const resp = await api.get(`${GO_TEAM_SERVICE_ROUTES.ALL}/${teamId}`);
        return [teamId, resp.data?.name ?? "Team"] as const;
      } catch {
        return [teamId, "Team"] as const;
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
  container: {
    alignItems: "center",
  },
  segmented: {
    marginBottom: 16,
    width: "90%",
  },
  cardWrap: {
    width: "90%",
    gap: 12,
  },
  teamName: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  inviteText: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    justifyContent: "flex-end",
  },
  actionButton: {
    flex: 1,
  },
});
