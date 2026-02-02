import React, { useLayoutEffect } from "react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";
import { Card } from "@/components/ui/card";
import { MemberRow } from "@/components/teams/member-row";
import { formatFullName } from "@/components/teams/member-row-utils";
import { useTeamDetail } from "@/hooks/use-team-detail";
import { useGetTeamMembers } from "@/hooks/use-get-team-members/use-get-team-members";
import {
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";

export default function ManageRolesScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = params.id;
  const teamId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const api = useAxiosWithClerk();
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { isOwner } = useTeamDetail(teamId);
  const {
    data: members = [],
    isLoading: membersLoading,
    isFetching: membersFetching,
  } = useGetTeamMembers(teamId);

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
        queryClient.invalidateQueries({ queryKey: ["league-memberships"] }),
      ]);
    },
    onError: (err) => {
      Alert.alert("Remove failed", errorToString(err));
    },
  });

  useLayoutEffect(() => {
    const renderHeader = () => (
      <Header
        left={<Button type="back" />}
        center={<PageTitle title="Manage Roles" />}
        right={
          isOwner && teamId ? (
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
  }, [navigation, isOwner, router, teamId]);

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

  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "red" }}
      paddingBottom={24}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Members</Text>

        {membersLoading || membersFetching ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : members.length === 0 ? (
          <Text style={styles.emptyText}>No members found.</Text>
        ) : (
          <View style={styles.memberList}>
            {members.map((member) => {
              const name = formatFullName(member.firstname, member.lastname);
              const roleLabel = formatRole(member.role);
              const canRemove =
                isOwner &&
                member.role !== "OWNER" &&
                !removeMemberMutation.isPending;

              return (
                <Card key={member.id}>
                  <MemberRow
                    name={name}
                    email={member.email}
                    right={
                      <>
                        <Text style={styles.memberRole}>{roleLabel}</Text>
                        {canRemove && (
                          <Pressable
                            style={styles.removeButton}
                            onPress={() => handleRemoveMember(member.id, name)}
                          >
                            <Text style={styles.removeButtonText}>Remove</Text>
                          </Pressable>
                        )}
                      </>
                    }
                  />
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </ContentArea>
  );
}
const formatRole = (role?: string | null) => {
  if (!role) return "Player";
  return role[0] + role.slice(1).toLowerCase();
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
  memberRole: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
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
});
