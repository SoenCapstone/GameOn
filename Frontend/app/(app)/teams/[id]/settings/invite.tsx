import { useMemo } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";
import { ContentArea } from "@/components/ui/content-area";
import { Empty } from "@/components/ui/empty";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { images } from "@/constants/images";
import { MenuCardItem } from "@/components/form/menu-card-item";
import { formatFullName } from "@/components/teams/member-row-utils";
import { Loading } from "@/components/ui/loading";
import { useTeamDetail } from "@/hooks/use-team-detail";
import { useGetTeamMembers } from "@/hooks/use-get-team-members";
import { fetchUserDirectory } from "@/hooks/messages/api";
import {
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";
import { usePostHog } from "posthog-react-native";

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
  const posthog = usePostHog();

  const { isOwner, role: myRole } = useTeamDetail(teamId);
  const canInvite = isOwner || myRole === "MANAGER" || myRole === "COACH";

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
    enabled: Boolean(teamId && canInvite),
  });

  const { data: userDirectory = [], isLoading: usersLoading } = useQuery({
    queryKey: ["user-directory"],
    queryFn: async () => fetchUserDirectory(api),
    enabled: Boolean(teamId && canInvite),
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
    onSuccess: async (_data, payload) => {
      posthog.capture("team_invite_sent", {
        team_id: payload.teamId,
        role: payload.role,
      });
      await queryClient.invalidateQueries({
        queryKey: ["team-invites", teamId],
      });
      toast.success("Invite Sent", {
        description: "The invitation was sent successfully.",
      });
    },
    onError: (err) => {
      toast.error("Invite Failed", {
        description: errorToString(err),
      });
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
    usersLoading;

  return (
    <ContentArea
      background={{ preset: "red", mode: "form" }}
      toolbar={<InviteMemberToolbar />}
    >
      <Form accentColor={AccentColors.red}>
        <Form.Section header="Available Users">
          {isBusy ? (
            <Loading />
          ) : availableUsers.length === 0 ? (
            <Empty message="No available players to invite" />
          ) : (
            availableUsers.map((user) => {
              const name = formatFullName(user.firstname, user.lastname);
              return (
                <MenuCardItem
                  key={user.id}
                  title={name}
                  subtitle={user.email}
                  image={
                    user.imageUrl
                      ? { uri: user.imageUrl }
                      : images.defaultProfile
                  }
                  button={{
                    label: "Invite",
                    onPress: () =>
                      createInviteMutation.mutate({
                        teamId,
                        inviteeUserId: user.id,
                        role: "PLAYER",
                      }),
                    disabled: createInviteMutation.isPending,
                  }}
                />
              );
            })
          )}
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
