import { useCallback, useLayoutEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import {
  useCancelLeagueMatch,
  useCancelTeamMatch,
  useLeaguesByIds,
  useLeagueMatches,
  useTeamMatches,
  useTeamMatch,
} from "@/hooks/use-matches";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import { errorToString } from "@/utils/error";
import { MatchDetailsContent } from "@/components/matches/match-details-content";
import { useMatchPresentation } from "@/hooks/use-match-presentation";

export default function MatchDetailsScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    context?: "team" | "league";
    contextId?: string;
  }>();

  const matchId = params.id ?? "";
  const context = params.context ?? "team";
  const contextId = params.contextId ?? "";
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const navigation = useNavigation();

  const teamMatchQuery = useTeamMatch(context === "team" ? matchId : "");
  const teamMatchesQuery = useTeamMatches(context === "team" ? contextId : "");
  const teamListMatch =
    context === "team"
      ? teamMatchesQuery.data?.find((m) => m.id === matchId)
      : undefined;
  const match = teamMatchQuery.data ?? teamListMatch;

  const { data: leagueMatches = [] } = useLeagueMatches(
    context === "league" ? contextId : "",
  );
  const leagueMatch =
    context === "league" ? leagueMatches.find((m) => m.id === matchId) : null;

  const { league, isOwner: isLeagueOwner } = useLeagueDetail(
    context === "league" ? contextId : "",
  );

  const displayMatch = leagueMatch || match;
  const teamContextLeagueId =
    context === "team" &&
    displayMatch &&
    "leagueId" in displayMatch &&
    displayMatch.leagueId
      ? displayMatch.leagueId
      : "";
  const { data: teamContextLeagueMap } = useLeaguesByIds(
    teamContextLeagueId ? [teamContextLeagueId] : [],
  );
  const contextLabel =
    context === "league"
      ? (league?.name ?? "League Match")
      : teamContextLeagueId
        ? (teamContextLeagueMap?.[teamContextLeagueId]?.name ?? "League Match")
        : "Team Match";
  const { homeTeam, awayTeam, title, isPast, refereeName } =
    useMatchPresentation(displayMatch);
  const isMatchLoading =
    context === "league"
      ? false
      : teamMatchQuery.isLoading || teamMatchesQuery.isLoading;

  const cancelLeagueMutation = useCancelLeagueMatch(contextId);
  const cancelTeamMutation = useCancelTeamMatch();

  const renderMatchHeader = useCallback(() => {
    return (
      <Header
        left={<Button type="back" />}
        center={<PageTitle title={title} />}
      />
    );
  }, [title]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: renderMatchHeader,
    });
  }, [navigation, renderMatchHeader]);

  if (isMatchLoading && !displayMatch) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  if (!displayMatch) {
    return <Text style={styles.empty}>Match not found</Text>;
  }

  let canCancel = false;
  if (context === "league" && leagueMatch) {
    canCancel = !isPast && isLeagueOwner && leagueMatch.status !== "CANCELLED";
  } else if (context === "team" && match) {
    canCancel = Boolean(
      !isPast &&
        ((homeTeam?.ownerUserId && homeTeam.ownerUserId === userId) ||
          (awayTeam?.ownerUserId && awayTeam.ownerUserId === userId)) &&
        match.status !== "CANCELLED",
    );
  }

  const handleCancel = async () => {
    try {
      if (context === "league" && cancelLeagueMutation) {
        await cancelLeagueMutation.mutateAsync({ matchId });
        await queryClient.invalidateQueries({
          queryKey: ["league-matches", contextId],
        });
      } else if (context === "team" && cancelTeamMutation) {
        await cancelTeamMutation.mutateAsync({ matchId });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["team-match", matchId] }),
          queryClient.invalidateQueries({
            queryKey: ["team-matches", contextId],
          }),
        ]);
      }
    } catch (err) {
      Alert.alert("Cancel failed", errorToString(err));
    }
  };

  return (
    <MatchDetailsContent
      startTime={displayMatch.startTime}
      status={displayMatch.status}
      homeTeamName={homeTeam?.name ?? "Home Team"}
      awayTeamName={awayTeam?.name ?? "Away Team"}
      homeTeamLogoUrl={homeTeam?.logoUrl}
      awayTeamLogoUrl={awayTeam?.logoUrl}
      sport={displayMatch.sport}
      contextLabel={contextLabel}
      refereeName={refereeName}
      venueName={displayMatch.matchLocation}
      canCancel={canCancel}
      onConfirmCancel={handleCancel}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: 24,
    alignItems: "center",
  },
  empty: {
    color: "#fff",
    fontSize: 16,
    marginTop: 24,
  },
});
