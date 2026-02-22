import { useLayoutEffect, useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import {
  GO_USER_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import {
  useCancelLeagueMatch,
  useLeagueMatches,
  useTeamsByIds,
} from "@/hooks/use-matches";
import { formatMatchDateTime, getMatchSection, toBadgeStatus } from "@/features/matches/utils";
import { matchStyles, statusColors } from "@/components/matches/match-styles";
import { errorToString } from "@/utils/error";

export default function LeagueMatchDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string; matchId?: string }>();
  const leagueId = params.id ?? "";
  const matchId = params.matchId ?? "";
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const api = useAxiosWithClerk();

  const { data: matches = [] } = useLeagueMatches(leagueId);
  const match = matches.find((item) => item.id === matchId);

  const teamIds = useMemo(
    () => (match ? [match.homeTeamId, match.awayTeamId] : []),
    [match],
  );
  const teamsQuery = useTeamsByIds(teamIds);
  const { isOwner } = useLeagueDetail(leagueId);

  const cancelMutation = useCancelLeagueMatch(leagueId);

  const homeTeam = teamsQuery.data?.[match?.homeTeamId ?? ""];
  const awayTeam = teamsQuery.data?.[match?.awayTeamId ?? ""];
  const title = homeTeam && awayTeam ? `${homeTeam.name} vs ${awayTeam.name}` : "Match Details";

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
          left={<Button type="back" />}
          center={<PageTitle title={title} />}
        />
      ),
    });
  }, [navigation, title]);

  const refereeNameQuery = useQuery({
    queryKey: ["user-name", match?.refereeUserId ?? ""],
    queryFn: async () => {
      const refereeUserId = match?.refereeUserId;
      if (!refereeUserId) return "No referee assigned";
      const resp = await api.get(GO_USER_SERVICE_ROUTES.BY_ID(refereeUserId));
      const first = resp.data?.firstname ?? "";
      const last = resp.data?.lastname ?? "";
      const full = `${first} ${last}`.trim();
      return full || "No referee assigned";
    },
    enabled: Boolean(match?.refereeUserId),
    retry: false,
  });

  if (!match) {
    return (
      <ContentArea backgroundProps={{ preset: "red" }}>
        <Text style={styles.empty}>Match not found</Text>
      </ContentArea>
    );
  }

  const section = getMatchSection(match.startTime, match.endTime, match.status);
  const isPast = section === "past";
  const badgeStatus = toBadgeStatus(match.status);
  const canCancel = !isPast && isOwner && match.status !== "CANCELLED";

  const refereeText = match.refereeUserId
    ? `Referee: ${refereeNameQuery.data ?? "Loading..."}`
    : "Referee: No referee assigned";

  return (
    <ContentArea scrollable backgroundProps={{ preset: "red", mode: "form" }}>
      <Card>
        <View style={{ gap: 12 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.team}>{homeTeam?.name ?? "Home Team"}</Text>
            <Text style={styles.vs}>vs</Text>
            <Text style={styles.team}>{awayTeam?.name ?? "Away Team"}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.meta}>{formatMatchDateTime(match.startTime)}</Text>
            <View
              style={[
                matchStyles.badge,
                { backgroundColor: statusColors[badgeStatus] ?? "rgba(44,106,189,0.95)" },
              ]}
            >
              <Text style={matchStyles.badgeText}>{badgeStatus}</Text>
            </View>
          </View>

          <Text style={styles.meta}>{refereeText}</Text>
          <Text style={styles.meta}>Venue: {match.matchLocation || "Not set"}</Text>
        </View>
      </Card>

      {canCancel ? (
        <Pressable
          style={styles.cancelButton}
          onPress={() => {
            Alert.alert("Cancel match", "Are you sure you want to cancel this match?", [
              { text: "Keep", style: "cancel" },
              {
                text: "Cancel Match",
                style: "destructive",
                onPress: async () => {
                  try {
                    await cancelMutation.mutateAsync({ matchId });
                    await queryClient.invalidateQueries({ queryKey: ["league-matches", leagueId] });
                  } catch (err) {
                    Alert.alert("Cancel failed", errorToString(err));
                  }
                },
              },
            ]);
          }}
        >
          <Text style={styles.cancelText}>Cancel Match</Text>
        </Pressable>
      ) : null}
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: "#fff",
    fontSize: 16,
    marginTop: 24,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  team: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    flex: 1,
  },
  vs: {
    color: "rgba(255,255,255,0.75)",
    fontWeight: "700",
  },
  meta: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
  },
  cancelButton: {
    borderRadius: 999,
    backgroundColor: "rgba(255,0,0,0.22)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  cancelText: {
    color: "#ffb3b3",
    fontWeight: "700",
  },
});
