import React, { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";
import { Card } from "@/components/ui/card";
import { MemberRow } from "@/components/teams/member-row";
import { formatFullName } from "@/components/teams/member-row-utils";
import { useTeamDetail } from "@/hooks/use-team-detail";
import { useGetTeamMembers } from "@/hooks/use-get-team-members/use-get-team-members";
import { TeamMember } from "@/hooks/use-get-team-members/model";
import {
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";

type TeamRoleType = "OWNER" | "MANAGER" | "PLAYER" | "COACH";

const AVAILABLE_ROLES: {
  role: TeamRoleType;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    role: "OWNER",
    description: "Full access. Can assign roles, edit team, manage roster.",
    icon: "shield-checkmark",
    color: "#FF383C",
  },
  {
    role: "MANAGER",
    description: "Can manage roster, invites, and team settings.",
    icon: "shield-half",
    color: "#FF8D28",
  },
  {
    role: "PLAYER",
    description: "Basic access. Can view team info.",
    icon: "people",
    color: "#2494E4",
  },
  {
    role: "COACH",
    description: "Can manage roster. Limited team settings access.",
    icon: "people",
    color: "#34C759",
  },
];

const formatRole = (role?: string | null) => {
  if (!role) return "Player";
  return role[0] + role.slice(1).toLowerCase();
};

/**
 * Returns the role options a caller can assign to a given target member.
 *  - Owners can assign MANAGER, PLAYER, COACH to any non-owner.
 *  - Managers can change PLAYER and COACH roles between PLAYER and COACH (not MANAGER).
 *  - Returns empty array if no changes are allowed.
 */
function getAssignableRoles(
  callerRole: string | undefined,
  targetRole: TeamRoleType | undefined,
): TeamRoleType[] {
  if (!callerRole || targetRole === "OWNER") return [];

  if (callerRole === "OWNER") {
    return ["MANAGER", "PLAYER", "COACH"];
  }

  if (callerRole === "MANAGER" && (targetRole === "PLAYER" || targetRole === "COACH")) {
    return ["PLAYER", "COACH"];
  }

  return [];
}

function MembersContent({
  isLoading,
  isError,
  members,
  isAdmin,
  callerRole,
  currentUserId,
  removePending,
  onRetry,
  onRemove,
  onRoleChange,
}: Readonly<{
  isLoading: boolean;
  isError: boolean;
  members: TeamMember[];
  isAdmin: boolean;
  callerRole: string | undefined;
  currentUserId: string | null;
  removePending: boolean;
  onRetry: () => void;
  onRemove: (memberId: string, name: string) => void;
  onRoleChange: (
    member: { id: string; role?: TeamRoleType | null; userId?: string },
    newRole: TeamRoleType,
  ) => void;
}>) {
  if (isLoading) {
    return <ActivityIndicator size="small" color="#fff" />;
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.emptyText}>Failed to load members.</Text>
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (members.length === 0) {
    return <Text style={styles.emptyText}>No members found.</Text>;
  }

  return (
    <View style={styles.memberList}>
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          isAdmin={isAdmin}
          callerRole={callerRole}
          currentUserId={currentUserId}
          removePending={removePending}
          onRemove={onRemove}
          onRoleChange={onRoleChange}
        />
      ))}
    </View>
  );
}

function MemberCard({
  member,
  isAdmin,
  callerRole,
  currentUserId,
  removePending,
  onRemove,
  onRoleChange,
}: Readonly<{
  member: TeamMember;
  isAdmin: boolean;
  callerRole: string | undefined;
  currentUserId: string | null;
  removePending: boolean;
  onRemove: (memberId: string, name: string) => void;
  onRoleChange: (
    member: { id: string; role?: TeamRoleType | null; userId?: string },
    newRole: TeamRoleType,
  ) => void;
}>) {
  const name = formatFullName(member.firstname, member.lastname);
  const roleLabel = formatRole(member.role);
  const memberRole = member.role as TeamRoleType | undefined;
  const memberId = member.userId ?? member.id;
  const isSelf = memberId === currentUserId;

  // Remove rules:
  // - Cannot remove the owner
  // - Cannot remove yourself
  // - Managers cannot remove other managers
  const canRemove =
    isAdmin &&
    !isSelf &&
    memberRole !== "OWNER" &&
    !(callerRole === "MANAGER" && memberRole === "MANAGER") &&
    !removePending;

  // Role edit rules: delegate to getAssignableRoles
  // - Cannot edit your own role
  const assignableRoles = isSelf
    ? []
    : getAssignableRoles(callerRole, memberRole);
  const canEditRole = assignableRoles.length > 1;

  const handleAlertOption = (label: string) => {
    if (label === "Cancel") return;
    const selectedRole = assignableRoles.find(
      (r) => formatRole(r) === label,
    );
    if (selectedRole) {
      onRoleChange(
        member as { id: string; role?: TeamRoleType | null; userId?: string },
        selectedRole,
      );
    }
  };

  const handleRolePicker = () => {
    const options = assignableRoles
      .filter((r) => r !== memberRole)
      .map(formatRole);
    options.push("Cancel");

    const buttons = options.map((label) => ({
      text: label,
      style: label === "Cancel" ? ("cancel" as const) : ("default" as const),
      onPress: () => handleAlertOption(label),
    }));

    Alert.alert("Change Role", `Current role: ${roleLabel}`, buttons);
  };

  return (
    <Card>
      <MemberRow
        name={name}
        email={member.email}
        imageUrl={member.imageUrl}
        right={
          <View style={styles.memberActions}>
            {canEditRole ? (
              <Pressable style={styles.rolePicker} onPress={handleRolePicker}>
                <Text style={styles.rolePickerText}>{roleLabel}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="rgba(255,255,255,0.5)"
                />
              </Pressable>
            ) : (
              <Text style={styles.memberRole}>{roleLabel}</Text>
            )}

            {canRemove && (
              <Pressable
                style={styles.removeButton}
                onPress={() => onRemove(memberId, name)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            )}
          </View>
        }
      />
    </Card>
  );
}

// ── Main screen ───────────────────────────────────────────────────────

export default function ManageRolesScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = params.id;
  const teamId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const api = useAxiosWithClerk();
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const { isOwner, role: myRole } = useTeamDetail(teamId);
  const isAdmin = isOwner || myRole === "MANAGER";
  const canInvite = isAdmin || myRole === "COACH";

  const {
    data: members = [],
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useGetTeamMembers(teamId);

  const [rolesOpen, setRolesOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(true);

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(
        GO_TEAM_SERVICE_ROUTES.REMOVE_TEAM_MEMBER(teamId, memberId),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["team-members", teamId] }),
        queryClient.invalidateQueries({ queryKey: ["team-membership"] }),
      ]);
    },
    onError: (err) => {
      Alert.alert("Remove failed", errorToString(err));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      targetUserId,
      role,
    }: {
      targetUserId: string;
      role: TeamRoleType;
    }) => {
      await api.patch(
        GO_TEAM_SERVICE_ROUTES.UPDATE_MEMBER_ROLE(teamId, targetUserId),
        { role },
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["team-members", teamId] }),
        queryClient.invalidateQueries({ queryKey: ["team-membership"] }),
      ]);
    },
    onError: (err) => {
      Alert.alert("Role change failed", errorToString(err));
    },
  });

  useLayoutEffect(() => {
    const renderHeader = () => (
      <Header
        left={<Button type="back" />}
        center={<PageTitle title="Manage Roles" />}
        right={
          canInvite && teamId ? (
            <Button
              type="custom"
              icon="plus"
              onPress={() => router.push(`/teams/${teamId}/invite`)}
            />
          ) : undefined
        }
      />
    );

    navigation.setOptions({
      headerTitle: renderHeader,
    });
  }, [navigation, canInvite, router, teamId]);

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

  const handleRoleChange = (
    member: { id: string; role?: TeamRoleType | null; userId?: string },
    newRole: TeamRoleType,
  ) => {
    const memberId = member.userId ?? member.id;
    const currentRole = member.role;

    if (newRole === currentRole) return;

    const currentLabel = formatRole(currentRole);
    const newLabel = formatRole(newRole);

    Alert.alert(
      "Change Role",
      `Change role from ${currentLabel} to ${newLabel}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            updateRoleMutation.mutate({ targetUserId: memberId, role: newRole }),
        },
      ],
    );
  };

  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "red" }}
      paddingBottom={24}
    >
      <View style={styles.section}>
        <Pressable
          style={styles.collapsibleHeader}
          onPress={() => setRolesOpen((v) => !v)}
        >
          <Text style={styles.sectionTitle}>Available Roles</Text>
          <Ionicons
            name={rolesOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color="rgba(255,255,255,0.7)"
          />
        </Pressable>

        {rolesOpen && (
          <View style={styles.roleList}>
            {AVAILABLE_ROLES.map(({ role, description, icon, color }) => (
              <Card key={role}>
                <View style={styles.roleRow}>
                  <View
                    style={[styles.roleIconWrap, { backgroundColor: `${color}22` }]}
                  >
                    <Ionicons name={icon} size={22} color={color} />
                  </View>
                  <View style={styles.roleInfo}>
                    <Text style={styles.roleName}>{formatRole(role)}</Text>
                    <Text style={styles.roleDesc}>{description}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Pressable
          style={styles.collapsibleHeader}
          onPress={() => setMembersOpen((v) => !v)}
        >
          <Text style={styles.sectionTitle}>Team Members</Text>
          <Ionicons
            name={membersOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color="rgba(255,255,255,0.7)"
          />
        </Pressable>

        {membersOpen && (
          <MembersContent
            isLoading={membersLoading}
            isError={membersError}
            members={members}
            isAdmin={isAdmin}
            callerRole={myRole}
            currentUserId={userId ?? null}
            removePending={removeMemberMutation.isPending}
            onRetry={() => refetchMembers()}
            onRemove={handleRemoveMember}
            onRoleChange={handleRoleChange}
          />
        )}
      </View>
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    gap: 16,
    paddingTop: 12,
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  roleList: {
    gap: 10,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  roleIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roleInfo: {
    flex: 1,
    gap: 2,
  },
  roleName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  roleDesc: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 16,
  },
  memberList: {
    gap: 14,
  },
  memberActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  memberRole: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  rolePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  rolePickerText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,0,0,0.2)",
  },
  removeButtonText: {
    color: "#ffb3b3",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  errorContainer: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});