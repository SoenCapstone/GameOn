import { useCallback, useState } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { View, Text, RefreshControl, Alert } from "react-native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Card } from "@/components/ui/card";
import { ButtonItem } from "@/components/form/button-item";
import { styles, denyColor } from "@/components/teams/homepage-styles";
import { AxiosInstance } from "axios";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GO_INVITE_ROUTES,
  GO_LEAGUE_INVITE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
  GO_USER_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";
import {
  fetchLeagueInvitesWithDetails,
  LeagueInviteCard,
} from "@/components/leagues/league-invite-utils";

type TeamInviteCard = {
  kind: "team";
  id: string;
  teamName: string;
  inviterName?: string;
  teamId: string;
};

type InviteCard = TeamInviteCard | LeagueInviteCard;

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
  const [tab, setTab] = useState<"updates" | "spectating">("updates");
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const { data: invites = [], isFetching, refetch } = useQuery<InviteCard[]>({
    queryKey: ["user-updates", userId],
    queryFn: async () => fetchUpdatesWithDetails(api),
    enabled: Boolean(userId),
  });

  const handleInviteResponseError = useCallback((err: unknown) => {
    Alert.alert("Action failed", errorToString(err));
  }, []);

  const handleInviteResponseSuccess = useCallback(
    (invalidateKeys: string[][], acceptedMessage: string) =>
      (_data: unknown, variables: { invitationId: string; isAccepted: boolean }) => {
        const cacheKey = ["user-updates", userId];
        const currentInvites =
          queryClient.getQueryData<InviteCard[]>(cacheKey) ?? [];
        queryClient.setQueryData<InviteCard[]>(
          cacheKey,
          currentInvites.filter((invite) => invite.id !== variables.invitationId),
        );
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        Alert.alert(
          variables.isAccepted ? "Invite accepted" : "Invite declined",
          variables.isAccepted ? acceptedMessage : "The invitation was declined.",
        );
      },
    [queryClient, userId],
  );

  const respondMutation = useMutation({
    mutationFn: async (payload: { invitationId: string; isAccepted: boolean }) => {
      await api.post(GO_INVITE_ROUTES.RESPOND, payload);
    },
    onSuccess: handleInviteResponseSuccess(
      [["teams"], ["team-members"], ["team-membership"], ["leagues"], ["league-memberships"]],
      "You have joined the team.",
    ),
    onError: handleInviteResponseError,
  });

  const respondLeagueInviteMutation = useMutation({
    mutationFn: async (payload: { invitationId: string; isAccepted: boolean }) => {
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
        Alert.alert("Missing league invite", "Could not find that league invite.");
        return;
      }

      if (!maybe.leagueId) {
        Alert.alert("Missing league info", "Could not find leagueId for this invite.");
        return;
      }

      respondLeagueInviteMutation.mutate({ invitationId: inviteId, isAccepted: true });
    },
    [invites, respondLeagueInviteMutation],
  );


  const handleDenyLeague = useCallback(
    (inviteId: string) => {
      respondLeagueInviteMutation.mutate({ invitationId: inviteId, isAccepted: false });
    },
    [respondLeagueInviteMutation],
  );

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "blue" }}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      <View style={styles.container}>
        <SegmentedControl
          values={["My Updates", "Spectating"]}
          selectedIndex={tab === "updates" ? 0 : 1}
          onValueChange={(value) => {
            if (value === "My Updates") setTab("updates");
            if (value === "Spectating") setTab("spectating");
          }}
          style={styles.segmented}
        />

        {tab === "updates" ? (
          <View style={styles.cardWrap}>
            {invites.length === 0 ? (
              <Text style={styles.inviteText}>No pending invitations.</Text>
            ) : (
              invites.map((invite) => (
                <Card key={invite.id}>
                  {invite.kind === "team" ? (
                    <>
                      <Text style={styles.teamName}>{invite.teamName}</Text>

                      <Text style={styles.inviteText}>
                        You received an invite
                        {invite.inviterName ? ` from ${invite.inviterName}` : ""}{" "}
                        to join {invite.teamName}.
                      </Text>

                      <View style={styles.actionsRow}>
                        <ButtonItem
                          label="Deny"
                          color={denyColor}
                          onPress={() => handleDeny(invite.id)}
                        />
                        <ButtonItem
                          label="Accept"
                          onPress={() => handleAccept(invite.id)}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.teamName}>{invite.leagueName}</Text>
                      <Text style={styles.inviteText}>
                        You received an invite to join {invite.leagueName} with{" "}
                        {invite.teamName}.
                      </Text>
                      <View style={styles.actionsRow}>
                        <ButtonItem
                          label="Deny"
                          color={denyColor}
                          onPress={() => handleDenyLeague(invite.id)}
                        />
                        <ButtonItem
                          label="Accept"
                          onPress={() => handleAcceptLeague(invite.id)}
                        />
                      </View>
                    </>
                  )}
                </Card>
              ))
            )}
          </View>
        ) : (
          <View />
        )}
      </View>
    </ContentArea>
  );
}

async function fetchUpdatesWithDetails(api: AxiosInstance) {
  const [teamInvites, leagueInvites] = await Promise.all([
    fetchTeamInvitesWithDetails(api),
    fetchLeagueInvitesWithDetails(api),
  ]);

  return [...teamInvites, ...leagueInvites];
}

async function fetchTeamInvitesWithDetails(api: AxiosInstance) {
  const resp = await api.get<TeamInviteResponse[]>(
    GO_TEAM_SERVICE_ROUTES.USER_INVITES,
  );
  const invites = (resp.data ?? []).filter((invite) => invite.status === "PENDING");

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
      ? inviterMap[invite.invitedByUserId] ?? "Someone"
      : undefined,
  }));
}

async function fetchTeamNameMap(
  api: AxiosInstance,
  teamIds: string[],
) {
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

async function fetchUserNameMap(
  api: AxiosInstance,
  userIds: string[],
) {
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