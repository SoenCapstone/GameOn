import { useMemo } from "react";
import { Alert, Pressable, Text } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Card } from "@/components/ui/card";
import { MemberRow } from "@/components/teams/member-row";
import { formatFullName } from "@/components/teams/member-row-utils";
import {
  InviteSection,
  inviteSectionStyles as styles,
} from "@/components/invite/invite-section";
import { useTeamDetail } from "@/hooks/use-team-detail";
import { useGetTeamMembers } from "@/hooks/use-get-team-members/use-get-team-members";
import { fetchUserDirectory } from "@/hooks/messages/api";
import {
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
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

function InviteMemberToolbar() {
  return <Stack.Screen.Title>Invite Member</Stack.Screen.Title>;
}

export default function InvitePlayersScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = params.id;
  const teamId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const api = useAxiosWithClerk();
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
      const resp = await api.post(
        GO_TEAM_SERVICE_ROUTES.CREATE_INVITE,
        payload,
      );
      return resp.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["team-invites", teamId],
      });
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

  const isBusy =
    membersLoading ||
    membersFetching ||
    invitesLoading ||
    usersLoading ||
    createInviteMutation.isPending;

  return (
    <ContentArea
      background={{ preset: "red" }}
      toolbar={<InviteMemberToolbar />}
    >
      <InviteSection
        title="Available Members"
        isBusy={isBusy}
        emptyText="No available players to invite."
        hasItems={availableUsers.length > 0}
      >
        {availableUsers.map((user) => {
          const name = formatFullName(user.firstname, user.lastname);
          return (
            <Card key={user.id}>
              <MemberRow
                name={name}
                email={user.email}
                right={
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
                }
              />
            </Card>
          );
        })}
      </InviteSection>
    </ContentArea>
  );
}
