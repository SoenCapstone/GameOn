import { useState, useEffect, ReactNode } from "react";
import { Pressable } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation, StackActions } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActionSheet } from "@expo/react-native-action-sheet";
import ContextMenu from "react-native-context-menu-view";
import { toast } from "@/utils/toast";
import { ContentArea } from "@/components/ui/content-area";
import { Empty } from "@/components/ui/empty";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import { usePayment, type PaymentEntityType } from "@/hooks/use-payment";
import { formatAmount } from "@/utils/payment";
import { getSportLogo } from "@/utils/search";
import { formatMemberSince } from "@/utils/date";
import { MenuCardItem } from "@/components/form/menu-card-item";
import { useTeamsByIds } from "@/hooks/use-matches";
import { isRunningInExpoGo } from "@/utils/runtime";
import {
  handleLeagueDelete,
  handleLeagueRequestPurchase,
  handleLeagueSetPrivate,
  handleLeagueTeamRemove,
} from "@/utils/leagues";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import {
  useUpdateLeague,
  useDeleteLeague,
} from "@/hooks/use-team-league-settings";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import { Loading } from "@/components/ui/loading";

const log = createScopedLog("League Settings");

function LeagueSettingsToolbar() {
  return <Stack.Screen.Title>League Settings</Stack.Screen.Title>;
}

export default function LeagueSettingsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";

  return (
    <LeagueDetailProvider id={id}>
      <LeagueSettingsContent />
    </LeagueDetailProvider>
  );
}

function LeagueSettingsContent() {
  const { showActionSheetWithOptions } = useActionSheet();
  const navigation = useNavigation();
  const router = useRouter();
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();
  const {
    id,
    league,
    isLoading: leagueLoading,
    isOwner,
    leagueTeams,
  } = useLeagueDetailContext();

  const [isPublic, setIsPublic] = useState(false);
  const leagueTeamsQuery = useTeamsByIds(
    leagueTeams.map((team) => team.teamId),
  );

  useEffect(() => {
    setIsPublic((league?.privacy ?? "PRIVATE") === "PUBLIC");
  }, [league?.privacy]);

  const { runPayment, isPaying } = usePayment({
    api,
    entityType: "LEAGUE" as PaymentEntityType,
    entityId: id,
    amount: 1500,
  });

  const updateLeagueMutation = useUpdateLeague(id, {
    onSuccess: () => {
      log.info("League updated successfully");
    },
    onError: (err) => {
      log.error("Update league failed", errorToString(err));
      toast.error("Update Failed", {
        description: errorToString(err),
      });
    },
  });

  const deleteLeagueMutation = useDeleteLeague(id, {
    onSuccess: () => {
      log.info("League deleted successfully");
      navigation.dispatch(StackActions.pop(1));
      router.back();
    },
    onError: (err) => {
      log.error("Delete league failed", errorToString(err));
      toast.error("Delete Failed", {
        description: errorToString(err),
      });
    },
  });
  const removeTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await api.delete(GO_LEAGUE_SERVICE_ROUTES.REMOVE_TEAM(id, teamId));
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["league-teams", id] }),
        queryClient.invalidateQueries({ queryKey: ["league-memberships"] }),
      ]);
    },
    onError: (err) => {
      toast.error("Remove Failed", {
        description: errorToString(err),
      });
    },
  });

  if (!isOwner) {
    return (
      <ContentArea background={{ preset: "red" }}>
        <Empty message="You don't have permission to edit this league" />
      </ContentArea>
    );
  }

  if (!league && !leagueLoading) {
    return (
      <ContentArea background={{ preset: "red" }}>
        <Empty message="League not found" />
      </ContentArea>
    );
  }

  return (
    <ContentArea
      background={{ preset: "red", mode: "form" }}
      toolbar={<LeagueSettingsToolbar />}
    >
      {leagueLoading && <Loading />}

      <Form accentColor={AccentColors.red}>
        <Form.Section>
          <Form.Profile
            title={league?.name ?? "League"}
            subtitle={
              league?.sport
                ? `${league.sport.charAt(0).toUpperCase()}${league.sport.slice(1).toLowerCase()} League`
                : "League"
            }
            image={
              league?.logoUrl
                ? { uri: league.logoUrl }
                : getSportLogo(league.sport)
            }
            onPress={() => router.push(`/leagues/${id}/settings/edit`)}
            logo
          />
        </Form.Section>

        <Form.Section header="Teams">
          {leagueTeams.map((teamMembership) => {
            const team = leagueTeamsQuery.data?.[teamMembership.teamId];
            const teamName = team?.name ?? "Team";
            return (
              <LeagueTeamMenu
                key={teamMembership.id}
                canDelete={isOwner && !removeTeamMutation.isPending}
                onDelete={() =>
                  handleLeagueTeamRemove({
                    teamId: teamMembership.teamId,
                    teamName,
                    leagueName: league?.name,
                    onConfirm: (confirmedTeamId) =>
                      removeTeamMutation.mutate(confirmedTeamId),
                    showActionSheetWithOptions,
                  })
                }
              >
                <MenuCardItem
                  square
                  title={teamName}
                  subtitle={formatMemberSince(teamMembership.joinedAt)}
                  image={
                    team?.logoUrl
                      ? { uri: team.logoUrl }
                      : getSportLogo(team?.sport ?? league?.sport)
                  }
                />
              </LeagueTeamMenu>
            );
          })}
          <Form.Button
            button="Invite Teams"
            onPress={() => router.push(`/leagues/${id}/settings/invite`)}
          />
        </Form.Section>

        <Form.Section
          header="Visibility"
          footer={
            isPublic
              ? "Private leagues are not discoverable, cannot be followed by other users, and only members can see posts."
              : "Public leagues are discoverable, can be followed by other users, and can make public posts."
          }
        >
          {isPublic ? (
            <Form.Button
              button="Switch to a Private League"
              color={AccentColors.red}
              onPress={() =>
                handleLeagueSetPrivate({
                  league,
                  onConfirm: (payload) => {
                    updateLeagueMutation.mutate(payload);
                    setIsPublic(false);
                  },
                })
              }
              disabled={updateLeagueMutation.isPending}
            />
          ) : (
            <Form.Button
              button={isPaying ? "Processing…" : "Switch to a Public League"}
              color={AccentColors.red}
              onPress={() =>
                handleLeagueRequestPurchase({
                  league,
                  amountCents: 1500,
                  formatAmount,
                  runPayment,
                  onConfirm: (payload) => {
                    updateLeagueMutation.mutate(payload);
                    setIsPublic(true);
                  },
                })
              }
              disabled={isPaying}
            />
          )}
        </Form.Section>

        <Form.Section>
          <Form.Button
            button={
              deleteLeagueMutation.isPending ? "Deleting..." : "Delete League"
            }
            color={AccentColors.red}
            onPress={() =>
              handleLeagueDelete({
                onConfirm: () => deleteLeagueMutation.mutate(),
              })
            }
            disabled={deleteLeagueMutation.isPending}
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}

function LeagueTeamMenu({
  onDelete,
  canDelete,
  children,
}: Readonly<{
  onDelete: () => void;
  canDelete: boolean;
  children: ReactNode;
}>) {
  if (!canDelete) {
    return children;
  }

  if (isRunningInExpoGo) {
    return <Pressable onLongPress={onDelete}>{children}</Pressable>;
  }

  return (
    <ContextMenu
      actions={[
        {
          title: "Remove Team",
          systemIcon: "trash",
          destructive: true,
        },
      ]}
      onPress={(event) => {
        if (event.nativeEvent.name === "Remove Team") {
          onDelete();
        }
      }}
      previewBackgroundColor="transparent"
    >
      {children}
    </ContextMenu>
  );
}
