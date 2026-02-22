import { useLayoutEffect } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import {
  useCancelLeagueMatch,
  useLeagueMatches,
} from "@/hooks/use-matches";
import { errorToString } from "@/utils/error";
import { MatchDetailsContent } from "@/components/matches/match-details-content";
import { useMatchPresentation } from "@/hooks/use-match-presentation";

export default function LeagueMatchDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string; matchId?: string }>();
  const leagueId = params.id ?? "";
  const matchId = params.matchId ?? "";
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  const { data: matches = [] } = useLeagueMatches(leagueId);
  const match = matches.find((item) => item.id === matchId);
  const { isOwner } = useLeagueDetail(leagueId);

  const cancelMutation = useCancelLeagueMatch(leagueId);
  const { homeTeam, awayTeam, title, isPast, refereeText } = useMatchPresentation(match);

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
    });
  }, [navigation, title]);

  if (!match) {
    return (
      <ContentArea backgroundProps={{ preset: "red" }}>
        <Text style={styles.empty}>Match not found</Text>
      </ContentArea>
    );
  }

  const canCancel = !isPast && isOwner && match.status !== "CANCELLED";

  return (
    <MatchDetailsContent
      startTime={match.startTime}
      status={match.status}
      homeTeamName={homeTeam?.name ?? "Home Team"}
      awayTeamName={awayTeam?.name ?? "Away Team"}
      refereeText={refereeText}
      venueText={`Venue: ${match.matchLocation || "Not set"}`}
      canCancel={canCancel}
      onConfirmCancel={async () => {
        try {
          await cancelMutation.mutateAsync({ matchId });
          await queryClient.invalidateQueries({ queryKey: ["league-matches", leagueId] });
        } catch (err) {
          Alert.alert("Cancel failed", errorToString(err));
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    color: "#fff",
    fontSize: 16,
    marginTop: 24,
  },
});
