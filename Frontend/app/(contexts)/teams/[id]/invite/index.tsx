import React, { useLayoutEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";
import { Card } from "@/components/ui/card";
import { useTeamDetail } from "@/hooks/use-team-detail";
import { useGetTeamMembers } from "@/hooks/use-get-team-members/use-get-team-members";
import { fetchUserDirectory } from "@/features/messaging/api";
import { GO_TEAM_SERVICE_ROUTES, useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";

type TeamInviteResponse = {
  id: string;
  inviteeUserId?: string | null;
  status?: string | null;
};

type InvitePayload = {
  teamId: string;
  inviteeUserId: string;
  role: "PLAYER";
};

export default function InvitePlayersScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = params.id;
  const teamId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const api = useAxiosWithClerk();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const { isOwner } = useTeamDetail(teamId);

  const {
    data: members = [],
    isLoading: membersLoading,
    isFetching: membersFetching,
  } = useGetTeamMembers(teamId);

  const { data: teamInvites = [], isLoading: invitesLoading } = useQuery<
    TeamInviteResponse[]
  >({
    queryKey: ["team-invites", teamId],
    queryFn: async () => {
      const resp = await api.get(GO_TEAM_SERVICE_ROUTES.TEAM_INVITES(teamId));
      return resp.data ?? [];
    },
    enabled: Boolean(teamId && isOwner),
  });

  const { data: userDirectory = [], isLoading: usersLoading } = useQuery({
    queryKey: ["user-directory"],
    queryFn: async () => fetchUserDirectory(api),
    enabled: Boolean(teamId && isOwner),
    staleTime: 5 * 60 * 1000,
  });

  const createInviteMutation = useMutation({
    mutationFn: async (payload: InvitePayload) => {
      const resp = await api.post(GO_TEAM_SERVICE_ROUTES.CREATE_INVITE, payload);
      return resp.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team-invites", teamId] });
      Alert.alert("Invite sent", "The invitation was sent successfully.");
    },
    onError: (err) => {
      Alert.alert("Invite failed", errorToString(err));
    },
  });

  const availableUsers = useMemo(() => {
    const memberIds = new Set(members.map((member) => member.id));
    const pendingInvitees = new Set(
      teamInvites
        .filter((invite) => invite.status === "PENDING" && invite.inviteeUserId)
        .map((invite) => invite.inviteeUserId as string),
    );

    return userDirectory
      .filter((user) => user.id !== userId)
      .filter((user) => !memberIds.has(user.id))
      .filter((user) => !pendingInvitees.has(user.id));
  }, [members, teamInvites, userDirectory, userId]);

  useLayoutEffect(() => {
    const renderHeader = () => (
      <Header
        left={<HeaderButton type="back" />}
        center={<PageTitle title="Invite Players" />}
      />
    );

    navigation.setOptions({
      headerTitle: renderHeader,
    });
  }, [navigation]);

  const isBusy =
    membersLoading ||
    membersFetching ||
    invitesLoading ||
    usersLoading ||
    createInviteMutation.isPending;

  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "red" }}
      paddingBottom={24}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Players</Text>

        {isBusy && <ActivityIndicator size="small" color="#fff" />}

        {!isBusy && availableUsers.length === 0 ? (
          <Text style={styles.emptyText}>No available players to invite.</Text>
        ) : (
          <View style={styles.memberList}>
            {availableUsers.map((user) => {
              const name = formatFullName(user.firstname, user.lastname);
              return (
                <Card key={user.id}>
                  <View style={styles.memberRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {getInitials(name, user.email)}
                      </Text>
                    </View>

                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{name}</Text>
                      <Text style={styles.memberEmail}>{user.email}</Text>
                    </View>

                    <Pressable
                      style={[
                        styles.inviteButton,
                        createInviteMutation.isPending &&
                          styles.inviteButtonDisabled,
                      ]}
                      onPress={() =>
                        createInviteMutation.mutate({
                          teamId,
                          inviteeUserId: user.id,
                          role: "PLAYER",
                        })
                      }
                      disabled={createInviteMutation.isPending}
                    >
                      <Text style={styles.inviteButtonText}>Invite</Text>
                    </Pressable>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </ContentArea>
  );
}

const formatFullName = (first?: string | null, last?: string | null) => {
  const full = `${first ?? ""} ${last ?? ""}`.trim();
  return full || "Unknown Player";
};

const getInitials = (name: string, email?: string | null) => {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() ?? "?";
  }
  return email?.[0]?.toUpperCase() ?? "?";
};

const styles = StyleSheet.create({
  section: {
    width: "100%",
    gap: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  memberList: {
    gap: 14,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  memberEmail: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
  },
  inviteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,82,255,0.35)",
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    color: "#bcd4ff",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
});
