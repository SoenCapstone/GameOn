import React, { useCallback } from "react";
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
  GO_TEAM_SERVICE_ROUTES,
  GO_USER_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";

type Invite = {
  id: string;
  teamName: string;
  inviterName?: string;
  teamId: string;
};

type TeamInviteResponse = {
  id: string;
  teamId: string;
  invitedByUserId?: string | null;
  status?: string | null;
};

export default function Home() {
  const [tab, setTab] = React.useState<"updates" | "spectating">("updates");
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const { data: invites = [], isFetching, refetch } = useQuery<Invite[]>({
    queryKey: ["user-invites", userId],
    queryFn: async () => fetchInvitesWithDetails(api),
    enabled: Boolean(userId),
  });

  const respondMutation = useMutation({
    mutationFn: async (payload: { invitationId: string; isAccepted: boolean }) => {
      await api.post(GO_INVITE_ROUTES.RESPOND, payload);
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<Invite[]>(
        ["user-invites", userId],
        (previous) =>
          previous?.filter((invite) => invite.id !== variables.invitationId) ?? [],
      );
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (err) => {
      Alert.alert("Action failed", errorToString(err));
    },
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
                  <Text style={styles.teamName}>{invite.teamName}</Text>

                  <Text style={styles.inviteText}>
                    You received an invite
                    {invite.inviterName ? ` from ${invite.inviterName}` : ""} to
                    join {invite.teamName}.
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

async function fetchInvitesWithDetails(api: AxiosInstance) {
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
