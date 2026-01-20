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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";
import { Card } from "@/components/ui/card";
import { MemberRow } from "@/components/teams/member-row";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";

type LeagueTeamResponse = {
  id: string;
  leagueId: string;
  teamId: string;
  joinedAt: string;
};


type TeamDetailResponse = {
  id: string;
  name: string;
  sport?: string | null;
  location?: string | null;
};

export default function ManageLeagueScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = params.id;
  const leagueId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const api = useAxiosWithClerk();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isOwner } = useLeagueDetail(leagueId);

  const { data: leagueTeams = [], isFetching: teamsFetching } = useQuery<
    LeagueTeamResponse[]
  >({
    queryKey: ["league-teams", leagueId],
    queryFn: async () => {
      const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.TEAMS(leagueId));
      return resp.data ?? [];
    },
    enabled: Boolean(leagueId),
  });

  const teamIdsKey = useMemo(
    () => leagueTeams.map((team) => team.teamId).join(","),
    [leagueTeams],
  );

  const teamDetailsQuery = useQuery<Record<string, TeamDetailResponse>>({
    queryKey: ["league-team-details", leagueId, teamIdsKey],
    queryFn: async () => {
      const entries = await Promise.all(
        leagueTeams.map(async (team) => {
          try {
            const resp = await api.get(
              `${GO_TEAM_SERVICE_ROUTES.ALL}/${team.teamId}`,
            );
            return [team.teamId, resp.data] as const;
          } catch {
            return [
              team.teamId,
              { id: team.teamId, name: "Team", sport: null, location: null },
            ] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: leagueTeams.length > 0,
  });

  const removeTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await api.delete(GO_LEAGUE_SERVICE_ROUTES.REMOVE_TEAM(leagueId, teamId));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["league-teams", leagueId],
      });
    },
    onError: (err) => {
      Alert.alert("Remove failed", errorToString(err));
    },
  });

  useLayoutEffect(() => {
    const renderHeader = () => (
      <Header
        left={<HeaderButton type="back" />}
        center={<PageTitle title="Manage League" />}
        right={
          isOwner ? (
            <HeaderButton
              type="custom"
              icon="plus"
              route={`/leagues/${leagueId}/invite`}
            />
          ) : undefined
        }
      />
    );

    navigation.setOptions({
      headerTitle: renderHeader,
    });
  }, [leagueId, navigation, isOwner]);

  const handleRemoveTeam = (teamId: string, name: string) => {
    Alert.alert("Remove from League", `Remove ${name} from this league?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeTeamMutation.mutate(teamId),
      },
    ]);
  };

  const isBusy =
    teamsFetching ||
    teamDetailsQuery.isFetching ||
    removeTeamMutation.isPending;

  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "purple" }}
      paddingBottom={24}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>League Teams</Text>

        {isBusy && <ActivityIndicator size="small" color="#fff" />}

        {!isBusy && leagueTeams.length === 0 ? (
          <Text style={styles.emptyText}>No teams in this league yet.</Text>
        ) : (
          <View style={styles.memberList}>
            {leagueTeams.map((team) => {
              const details = teamDetailsQuery.data?.[team.teamId];
              const name = details?.name ?? "Team";
              const detailLine = details?.sport || details?.location || "Team";
              const canRemove = isOwner && !removeTeamMutation.isPending;

              return (
                <Card key={team.id}>
                  <MemberRow
                    name={name}
                    email={detailLine}
                    right={
                      canRemove ? (
                        <Pressable
                          style={styles.removeButton}
                          onPress={() => handleRemoveTeam(team.teamId, name)}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </Pressable>
                      ) : undefined
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
