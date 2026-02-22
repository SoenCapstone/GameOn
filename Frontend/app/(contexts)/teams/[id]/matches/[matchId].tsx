import { useLayoutEffect } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { useCancelTeamMatch, useTeamMatch } from "@/hooks/use-matches";
import { errorToString } from "@/utils/error";
import { MatchDetailsContent } from "@/components/matches/match-details-content";
import { useMatchPresentation } from "@/hooks/use-match-presentation";

export default function TeamMatchDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string; matchId?: string }>();
  const teamId = params.id ?? "";
  const matchId = params.matchId ?? "";
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const navigation = useNavigation();

  const { data: match } = useTeamMatch(matchId);
  const { homeTeam, awayTeam, title, isPast, refereeText } = useMatchPresentation(match);
  const cancelMutation = useCancelTeamMatch();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header left={<Button type="back" />} center={<PageTitle title={title} />} />
      ),
    });
  }, [navigation, title]);

  if (!match) {
    return (
      <ContentArea backgroundProps={{ preset: "red" }}>
        <Text style={styles.empty}>Match not found</Text>
      </ContentArea>
    );
  }

  const canCancel =
    !isPast &&
    ((homeTeam?.ownerUserId && homeTeam.ownerUserId === userId) ||
      (awayTeam?.ownerUserId && awayTeam.ownerUserId === userId)) &&
    match.status !== "CANCELLED";

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
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["team-match", matchId] }),
            queryClient.invalidateQueries({ queryKey: ["team-matches", teamId] }),
          ]);
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
