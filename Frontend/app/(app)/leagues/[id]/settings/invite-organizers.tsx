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
import { useLeagueDetail } from "@/hooks/use-league-detail";
import { fetchUserDirectory } from "@/hooks/messages/api";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";

function InviteOrganizerToolbar() {
  return <Stack.Screen.Title>Invite Organizers</Stack.Screen.Title>;
}

export default function InviteOrganizersScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = params.id;
  const leagueId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { isOwner, isOrganizer, league } = useLeagueDetail(leagueId);
  const canInvite = isOwner || isOrganizer;

  const { data: organizers = [], isLoading: organizersLoading } = useQuery<
    { id: string; userId: string }[]
  >({
    queryKey: ["league-organizers", leagueId],
    queryFn: async () => {
      const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.ORGANIZERS(leagueId));
      return resp.data ?? [];
    },
    enabled: Boolean(leagueId && canInvite),
  });

  const { data: pendingInviteeIds = [], isLoading: pendingLoading } = useQuery<
    string[]
  >({
    queryKey: ["league-organizer-pending-ids", leagueId],
    queryFn: async () => {
      const resp = await api.get(
        GO_LEAGUE_SERVICE_ROUTES.ORGANIZER_PENDING_IDS(leagueId),
      );
      return resp.data ?? [];
    },
    enabled: Boolean(leagueId && canInvite),
  });

  const { data: userDirectory = [], isLoading: usersLoading } = useQuery({
    queryKey: ["user-directory"],
    queryFn: async () => fetchUserDirectory(api),
    enabled: Boolean(leagueId && canInvite),
    staleTime: 5 * 60 * 1000,
  });

  const createInviteMutation = useMutation({
    mutationFn: async (inviteeUserId: string) => {
      await api.post(GO_LEAGUE_SERVICE_ROUTES.ORGANIZER_INVITES(leagueId), {
        inviteeUserId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["league-organizer-pending-ids", leagueId],
      });
      toast.success("Invite Sent", {
        description: "The organizer invitation was sent successfully.",
      });
    },
    onError: (err) => {
      toast.error("Invite Failed", { description: errorToString(err) });
    },
  });

  const availableUsers = useMemo(() => {
    const organizerIds = new Set(organizers.map((o) => o.userId));
    const pendingIds = new Set(pendingInviteeIds);
    const ownerId = league?.ownerUserId;

    return userDirectory
      .filter((user) => user.id !== userId)
      .filter((user) => user.id !== ownerId)
      .filter((user) => !organizerIds.has(user.id))
      .filter((user) => !pendingIds.has(user.id));
  }, [organizers, pendingInviteeIds, userDirectory, userId, league?.ownerUserId]);

  const isBusy = organizersLoading || pendingLoading || usersLoading;

  return (
    <ContentArea
      background={{ preset: "red", mode: "form" }}
      toolbar={<InviteOrganizerToolbar />}
    >
      <Form accentColor={AccentColors.red}>
        <Form.Section header="Available Users">
          {isBusy ? (
            <Loading />
          ) : availableUsers.length === 0 ? (
            <Empty message="No available users to invite" />
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
                    onPress: () => createInviteMutation.mutate(user.id),
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