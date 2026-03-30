import { useState, useEffect, ReactNode } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Pressable,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation, StackActions } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ContextMenu from "react-native-context-menu-view";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { images } from "@/constants/images";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { useDeleteTeam, useUpdateTeam } from "@/hooks/use-team-league-settings";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import { usePayment, type PaymentEntityType } from "@/hooks/use-payment";
import {
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { formatAmount } from "@/utils/payment";
import { useGetTeamMembers } from "@/hooks/use-get-team-members";
import { MenuCardItem } from "@/components/form/menu-card-item";
import { formatMemberSince } from "@/utils/date";
import { TeamMember } from "@/types/team-member";
import { isRunningInExpoGo } from "@/utils/runtime";

type TeamRole = NonNullable<TeamMember["role"]>;
const TEAM_ROLE_OPTIONS: readonly TeamRole[] = [
  "MANAGER",
  "PLAYER",
  "COACH",
] as const;

function TeamSettingsToolbar() {
  return <Stack.Screen.Title>Team Settings</Stack.Screen.Title>;
}

export default function TeamSettingsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";

  return (
    <TeamDetailProvider id={id}>
      <TeamSettingsContent />
    </TeamDetailProvider>
  );
}

const log = createScopedLog("Team Settings");

function formatRole(role?: TeamRole | null) {
  if (!role) {
    return "Player";
  }

  return role[0] + role.slice(1).toLowerCase();
}

function getAssignableRoles(
  callerRole: string | undefined,
  targetRole: TeamRole | undefined,
): TeamRole[] {
  if (!callerRole || targetRole === "OWNER") {
    return [];
  }

  if (callerRole === "OWNER") {
    return [...TEAM_ROLE_OPTIONS];
  }

  if (
    callerRole === "MANAGER" &&
    (targetRole === "PLAYER" || targetRole === "COACH")
  ) {
    return ["PLAYER", "COACH"];
  }

  return [];
}

function TeamSettingsContent() {
  const navigation = useNavigation();
  const router = useRouter();
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { id, team, isLoading, isOwner, role } = useTeamDetailContext();
  const teamMembersQuery = useGetTeamMembers(id);
  const canAccessSettings = isOwner || role === "MANAGER";

  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    setIsPublic((team?.privacy ?? "PRIVATE") === "PUBLIC");
  }, [team?.privacy]);

  const { runPayment, isPaying } = usePayment({
    api,
    entityType: "TEAM" as PaymentEntityType,
    entityId: id,
    amount: 1500,
  });

  const updateTeamMutation = useUpdateTeam(id, {
    onSuccess: () => {
      log.info("Team updated successfully");
    },
    onError: (err) => {
      log.error("Update team failed", errorToString(err));
      Alert.alert("Update failed", errorToString(err));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      targetUserId,
      nextRole,
    }: {
      targetUserId: string;
      nextRole: TeamRole;
    }) => {
      await api.patch(
        GO_TEAM_SERVICE_ROUTES.UPDATE_MEMBER_ROLE(id, targetUserId),
        {
          role: nextRole,
        },
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["team-members", id] }),
        queryClient.invalidateQueries({ queryKey: ["team-membership"] }),
      ]);
    },
    onError: (err) => {
      Alert.alert("Role change failed", errorToString(err));
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(GO_TEAM_SERVICE_ROUTES.REMOVE_TEAM_MEMBER(id, memberId));
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["team-members", id] }),
        queryClient.invalidateQueries({ queryKey: ["team-membership"] }),
      ]);
    },
    onError: (err) => {
      Alert.alert("Remove failed", errorToString(err));
    },
  });

  const deleteTeamMutation = useDeleteTeam(id, {
    onSuccess: () => {
      log.info("Team deleted successfully");
      navigation.dispatch(StackActions.pop(2));
      router.back();
    },
    onError: (err) => {
      log.error("Delete team failed", errorToString(err));
      Alert.alert("Delete failed", errorToString(err));
    },
  });

  const handleDeleteTeam = () => {
    Alert.alert(
      "Delete Team",
      "Are you sure you want to delete this team? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: () => deleteTeamMutation.mutate(),
          style: "destructive",
        },
      ],
    );
  };

  const handleRequestPurchase = () => {
    if (!team) return;
    const payload = {
      name: team.name ?? "",
      sport: team.sport ?? "",
      scope: team.scope ?? "",
      logoUrl: team.logoUrl ?? "",
      location: team.location ?? "",
      allowedRegions: team.allowedRegions ?? [],
      privacy: "PUBLIC" as const,
    };
    Alert.alert("Team Publication Payment", `Amount: ${formatAmount(1500)}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Pay & Continue",
        onPress: () =>
          runPayment(async () => {
            updateTeamMutation.mutate(payload);
            setIsPublic(true);
          }),
      },
    ]);
  };

  const handleSetPrivate = () => {
    if (!team) return;
    const payload = {
      name: team.name ?? "",
      sport: team.sport ?? "",
      scope: team.scope ?? "",
      logoUrl: team.logoUrl ?? "",
      location: team.location ?? "",
      allowedRegions: team.allowedRegions ?? [],
      privacy: "PRIVATE" as const,
    };
    updateTeamMutation.mutate(payload);
    setIsPublic(false);
  };

  const handleRoleChange = (member: TeamMember, nextRoleLabel: string) => {
    const memberRole = member.role as TeamRole | undefined;
    const nextRole = TEAM_ROLE_OPTIONS.find(
      (value) => formatRole(value) === nextRoleLabel,
    );
    const memberId = member.userId ?? member.id;

    if (!nextRole || nextRole === memberRole) {
      return;
    }

    Alert.alert(
      "Change Role",
      `Change role from ${formatRole(memberRole)} to ${formatRole(nextRole)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            updateRoleMutation.mutate({
              targetUserId: memberId,
              nextRole,
            }),
        },
      ],
    );
  };

  const handleRemoveMember = (memberId: string, name: string) => {
    Alert.alert("Remove from Team", `Remove ${name} from this team?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeMemberMutation.mutate(memberId),
      },
    ]);
  };

  if (!team && !isLoading) {
    return (
      <ContentArea background={{ preset: "red" }}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Team not found</Text>
        </View>
      </ContentArea>
    );
  }

  if (!canAccessSettings && team) {
    return (
      <ContentArea background={{ preset: "red" }}>
        <View style={styles.container}>
          <Text style={styles.errorText}>
            You don&apos;t have permission to edit this team
          </Text>
        </View>
      </ContentArea>
    );
  }

  return (
    <ContentArea
      background={{ preset: "red", mode: "form" }}
      toolbar={<TeamSettingsToolbar />}
    >
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <Form accentColor={AccentColors.red}>
        <Form.Section>
          <Form.Profile
            title={team?.name ?? "Team"}
            subtitle={
              team?.sport
                ? `${team.sport.charAt(0).toUpperCase()}${team.sport.slice(1).toLowerCase()} Team`
                : "Team"
            }
            image={team?.logoUrl ? { uri: team.logoUrl } : images.defaultLogo}
            onPress={() => router.push(`/teams/${id}/settings/edit`)}
            logo
          />
        </Form.Section>

        <Form.Section header="Members">
          {teamMembersQuery.data?.map((member) => {
            const fullName = `${member.firstname} ${member.lastname}`.trim();
            const memberName = fullName || member.email;
            const memberRole = member.role as TeamRole | undefined;
            const memberUserId = member.userId ?? member.id;
            const assignableRoles =
              memberRole && memberUserId !== userId
                ? getAssignableRoles(role, memberRole)
                : [];
            const canRemove =
              !removeMemberMutation.isPending &&
              memberUserId !== userId &&
              memberRole !== "OWNER" &&
              !(role === "MANAGER" && memberRole === "MANAGER");
            const roleOptions =
              assignableRoles.length > 0
                ? assignableRoles.map((teamRole) => formatRole(teamRole))
                : [formatRole(memberRole)];
            return (
              <TeamMemberMenu
                key={member.id}
                canRemove={canRemove}
                onRemove={() => handleRemoveMember(memberUserId, memberName)}
              >
                <MenuCardItem
                  title={memberName}
                  subtitle={formatMemberSince(member.joinedAt ?? "")}
                  menu={{
                    menuTitle: "Change Role",
                    options: roleOptions,
                    value: formatRole(memberRole),
                    onValueChange: (value) => handleRoleChange(member, value),
                    disabled:
                      memberRole === "OWNER" ||
                      memberUserId === userId ||
                      assignableRoles.length === 0 ||
                      updateRoleMutation.isPending,
                  }}
                  image={
                    member.imageUrl
                      ? { uri: member.imageUrl }
                      : images.defaultProfile
                  }
                />
              </TeamMemberMenu>
            );
          })}
          <Form.Button
            button="Invite Members"
            onPress={() => router.push(`/teams/${id}/settings/invite`)}
          />
        </Form.Section>

        <Form.Section
          header="Visibility"
          footer={
            isPublic
              ? "Private teams are not discoverable, cannot be followed by other users, and only members can see posts."
              : "Public teams are discoverable, can be followed by other users, and can make public posts."
          }
        >
          {isPublic ? (
            <Form.Button
              button="Switch to a Private Team"
              onPress={handleSetPrivate}
              disabled={updateTeamMutation.isPending}
            />
          ) : (
            <Form.Button
              button={isPaying ? "Processing…" : "Switch to a Public Team"}
              color={AccentColors.red}
              onPress={handleRequestPurchase}
              disabled={isPaying}
            />
          )}
        </Form.Section>

        {isOwner && (
          <Form.Section>
            <Form.Button
              button={
                deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"
              }
              color={AccentColors.red}
              onPress={handleDeleteTeam}
              disabled={deleteTeamMutation.isPending}
            />
          </Form.Section>
        )}
      </Form>
    </ContentArea>
  );
}

function TeamMemberMenu({
  canRemove,
  onRemove,
  children,
}: Readonly<{
  canRemove: boolean;
  onRemove: () => void;
  children: ReactNode;
}>) {
  if (!canRemove) {
    return children;
  }

  if (isRunningInExpoGo) {
    return <Pressable onLongPress={onRemove}>{children}</Pressable>;
  }

  return (
    <ContextMenu
      actions={[
        {
          title: "Remove Member",
          systemIcon: "trash",
          destructive: true,
        },
      ]}
      onPress={(event) => {
        if (event.nativeEvent.name === "Remove Member") {
          onRemove();
        }
      }}
      previewBackgroundColor="transparent"
    >
      {children}
    </ContextMenu>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingTop: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 999,
  },
});
