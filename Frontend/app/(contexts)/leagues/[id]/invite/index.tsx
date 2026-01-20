import React, { useLayoutEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";
import { Card } from "@/components/ui/card";
import { MemberRow } from "@/components/teams/member-row";
import {
  InviteSection,
  inviteSectionStyles as styles,
} from "@/components/invites/invite-section";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";
import { fetchTeamResults } from "@/components/browse/utils";
import {
  fetchPendingLeagueInvites,
  LeagueInviteResponse,
} from "@/components/leagues/league-invite-utils";

type LeagueTeamResponse = {
  id: string;
  leagueId: string;
  teamId: string;
  joinedAt: string;
};

type TeamSummaryResponse = {
  id: string;
  name: string;
  sport: string;
  location?: string | null;
};

export default function InviteTeamsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = params.id;
  const leagueId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const api = useAxiosWithClerk();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isOwner } = useLeagueDetail(leagueId);
  const [invitedTeamIds, setInvitedTeamIds] = useState<Set<string>>(new Set());

  const { data: leagueTeams = [], isFetching: leagueTeamsFetching } = useQuery<
    LeagueTeamResponse[]
  >({
    queryKey: ["league-teams", leagueId],
    queryFn: async () => {
      const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.TEAMS(leagueId));
      return resp.data ?? [];
    },
    enabled: Boolean(leagueId),
  });

  const teamListQuery = useQuery<TeamSummaryResponse[]>({
    queryKey: ["team-invite-list", leagueId],
    queryFn: async () => {
      const resp = await fetchTeamResults(api, "", false);
      return resp.items ?? [];
    },
    enabled: Boolean(leagueId && isOwner),
  });

  const pendingInvitesQuery = useQuery<LeagueInviteResponse[]>({
    queryKey: ["league-invites", leagueId],
    queryFn: async () => fetchPendingLeagueInvites(api, leagueId),
    enabled: Boolean(leagueId && isOwner),
  });

  const inviteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await api.post(GO_LEAGUE_SERVICE_ROUTES.INVITES(leagueId), { teamId });
    },
    onSuccess: async (_data, teamId) => {
      await queryClient.invalidateQueries({
        queryKey: ["league-teams", leagueId],
      });
      setInvitedTeamIds((prev) => new Set(prev).add(teamId));
      Alert.alert("Invite sent", "The invitation was sent successfully.");
    },
    onError: (err) => {
      Alert.alert("Invite failed", errorToString(err));
    },
  });

  useLayoutEffect(() => {
    const renderHeader = () => (
      <Header
        left={<HeaderButton type="back" />}
        center={<PageTitle title="Invite Teams" />}
      />
    );

    navigation.setOptions({
      headerTitle: renderHeader,
    });
  }, [navigation]);

  const teamIdSet = useMemo(
    () => new Set(leagueTeams.map((team) => team.teamId)),
    [leagueTeams],
  );

  const pendingInviteTeamIds = useMemo(
    () =>
      new Set(
        (pendingInvitesQuery.data ?? [])
          .filter((invite) => invite.status === "PENDING")
          .map((invite) => invite.teamId),
      ),
    [pendingInvitesQuery.data],
  );

  const availableTeams = useMemo(() => {
    const items = teamListQuery.data ?? [];
    return items.filter(
      (team) =>
        !teamIdSet.has(team.id) &&
        !invitedTeamIds.has(team.id) &&
        !pendingInviteTeamIds.has(team.id),
    );
  }, [invitedTeamIds, pendingInviteTeamIds, teamListQuery.data, teamIdSet]);

  const isBusy =
    leagueTeamsFetching ||
    teamListQuery.isFetching ||
    pendingInvitesQuery.isFetching ||
    inviteTeamMutation.isPending;

  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "purple" }}
      paddingBottom={24}
    >
      <InviteSection
        title="Available Teams"
        isBusy={isBusy}
        emptyText="No teams available to invite."
        hasItems={availableTeams.length > 0}
      >
        {availableTeams.map((team) => {
          const detailLine = team.sport || team.location || "Team";
          return (
            <Card key={team.id}>
              <MemberRow
                name={team.name}
                email={detailLine}
                right={
                  <Pressable
                    style={[
                      styles.inviteButton,
                      inviteTeamMutation.isPending && styles.inviteButtonDisabled,
                    ]}
                    onPress={() => inviteTeamMutation.mutate(team.id)}
                    disabled={inviteTeamMutation.isPending}
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
