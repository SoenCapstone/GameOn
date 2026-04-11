import { useMemo, useState } from "react";
import { Alert } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/utils/toast";
import { ContentArea } from "@/components/ui/content-area";
import { Empty } from "@/components/ui/empty";
import { Form } from "@/components/form/form";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import { errorToString } from "@/utils/error";
import { fetchTeamResults, getSportLogo } from "@/utils/search";
import { AccentColors } from "@/constants/colors";
import { MenuCardItem } from "@/components/form/menu-card-item";
import { useTeamsByIds } from "@/hooks/use-matches";
import { LeagueTeamMembership } from "@/types/matches";
import { LeagueInviteResponse } from "@/types/leagues";
import type { TeamSummaryResponse } from "@/types/teams";
import {
  buildLeagueTeamIdSet,
  fetchPendingLeagueInvites,
  buildPendingInviteTeamIdSet,
  filterAvailableLeagueInviteTeams,
} from "@/utils/leagues";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { Loading } from "@/components/ui/loading";

function InviteTeamsToolbar() {
  return <Stack.Screen.Title>Invite Teams</Stack.Screen.Title>;
}

export default function InviteTeamsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = params.id;
  const leagueId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const api = useAxiosWithClerk();
  const { isOwner, league } = useLeagueDetail(leagueId);
  const [invitedTeamIds, setInvitedTeamIds] = useState<Set<string>>(new Set());

  const { data: leagueTeams = [], isLoading: leagueTeamsLoading } = useQuery<
    LeagueTeamMembership[]
  >({
    queryKey: ["league-teams", leagueId],
    queryFn: async () => {
      const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.TEAMS(leagueId));
      return resp.data ?? [];
    },
    enabled: Boolean(leagueId),
  });

  const teamListQuery = useQuery<TeamSummaryResponse[]>({
    queryKey: ["team-invite-list", leagueId, league?.sport ?? ""],
    queryFn: async () => {
      const resp = await fetchTeamResults(api, "", false, league?.sport);
      return resp.items ?? [];
    },
    enabled: Boolean(leagueId && league?.sport),
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
      setInvitedTeamIds((prev) => new Set(prev).add(teamId));
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

  const teamIdSet = useMemo(
    () => buildLeagueTeamIdSet(leagueTeams),
    [leagueTeams],
  );

  const pendingInviteTeamIds = useMemo(
    () => buildPendingInviteTeamIdSet(pendingInvitesQuery.data ?? []),
    [pendingInvitesQuery.data],
  );

  const availableTeams = useMemo(() => {
    return filterAvailableLeagueInviteTeams(
      teamListQuery.data ?? [],
      league?.sport,
      teamIdSet,
      invitedTeamIds,
      pendingInviteTeamIds,
    );
  }, [
    invitedTeamIds,
    pendingInviteTeamIds,
    teamListQuery.data,
    teamIdSet,
    league?.sport,
  ]);
  const availableTeamDetailsQuery = useTeamsByIds(
    availableTeams.map((team) => team.id),
  );

  const isBusy =
    leagueTeamsLoading ||
    teamListQuery.isLoading ||
    pendingInvitesQuery.isLoading;

  const handleInviteTeam = (teamId: string, teamName: string) => {
    Alert.alert(
      `Invite ${teamName}?`,
      "Do you want to invite this team to join your league?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Invite",
          onPress: () => inviteTeamMutation.mutate(teamId),
        },
      ],
    );
  };

  return (
    <ContentArea
      background={{ preset: "red", mode: "form" }}
      toolbar={<InviteTeamsToolbar />}
    >
      <Form accentColor={AccentColors.red}>
        <Form.Section header="Available Teams">
          {isBusy ? (
            <Loading />
          ) : availableTeams.length === 0 ? (
            <Empty message="No teams available to invite." />
          ) : (
            availableTeams.map((team) => {
              const details = availableTeamDetailsQuery.data?.[team.id];
              const location =
                details?.location?.trim() || team.location?.trim() || "";

              return (
                <MenuCardItem
                  key={team.id}
                  title={details?.name ?? team.name}
                  subtitle={location.length > 0 ? location : "Unknown location"}
                  image={
                    details?.logoUrl || team.logoUrl
                      ? { uri: details?.logoUrl ?? team.logoUrl ?? "" }
                      : getSportLogo(details?.sport ?? team.sport)
                  }
                  square
                  button={{
                    label: "Invite",
                    onPress: () =>
                      handleInviteTeam(team.id, details?.name ?? team.name),
                    disabled: inviteTeamMutation.isPending,
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
