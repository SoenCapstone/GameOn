import { useCallback, useMemo } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import { MatchDetailsContent } from "@/components/matches/match-details-content";
import { useMatchPresentation } from "@/hooks/use-match-presentation";
import { isCancelledMatchStatus, isPastMatch } from "@/utils/matches";
import { errorToString } from "@/utils/error";
import {
  useCancelLeagueMatch,
  useCancelTeamMatch,
  useLeagueVenue,
  useLeaguesByIds,
  useLeagueMatches,
  useTeamVenue,
  useTeamMatches,
  useTeamMatch,
  useTeamsByIds,
} from "@/hooks/use-matches";
import {
  getContextLabel,
  getIsMatchLoading,
  getMatchScores,
  getTeamContextLeagueId,
} from "@/utils/match-details";

function renderMatchLoadingState(
  isMatchLoading: boolean,
  displayMatch: unknown,
) {
  if (isMatchLoading && !displayMatch) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  return null;
}

export default function MatchDetailsScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    context?: "team" | "league";
    contextId?: string;
    homeName?: string;
    awayName?: string;
    homeLogoUrl?: string;
    awayLogoUrl?: string;
  }>();

  const matchId = params.id ?? "";
  const context = params.context ?? "team";
  const contextId = params.contextId ?? "";

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

  const { league, isOwner } = useLeagueDetail(
    context === "league" ? contextId : "",
  );

  const displayMatch = leagueMatch || match;

  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const cancelTeamMutation = useCancelTeamMatch();
  const cancelLeagueMutation = useCancelLeagueMatch(
    context === "league" ? contextId : "",
  );

  const cancelTeamIds = useMemo(() => {
    if (
      context !== "team" ||
      !displayMatch ||
      typeof displayMatch !== "object"
    ) {
      return [];
    }
    if (!("homeTeamId" in displayMatch) || !("awayTeamId" in displayMatch)) {
      return [];
    }
    const home = displayMatch.homeTeamId;
    const away = displayMatch.awayTeamId;
    return typeof home === "string" && typeof away === "string"
      ? [home, away]
      : [];
  }, [context, displayMatch]);

  const teamsForCancelQuery = useTeamsByIds(cancelTeamIds);

  const canCancelMatch = useMemo(() => {
    if (!displayMatch || typeof displayMatch !== "object") return false;
    if (
      !("startTime" in displayMatch) ||
      typeof displayMatch.startTime !== "string"
    ) {
      return false;
    }
    if (isPastMatch(displayMatch.startTime)) return false;
    if (
      "status" in displayMatch &&
      typeof displayMatch.status === "string" &&
      isCancelledMatchStatus(displayMatch.status)
    ) {
      return false;
    }

    if (context === "league") {
      return isOwner;
    }

    const isLeagueMatch =
      "leagueId" in displayMatch &&
      typeof displayMatch.leagueId === "string" &&
      Boolean(displayMatch.leagueId);
    if (isLeagueMatch) return false;
    if (!userId) return false;
    if (!("homeTeamId" in displayMatch) || !("awayTeamId" in displayMatch)) {
      return false;
    }
    const homeOwnerId =
      teamsForCancelQuery.data?.[displayMatch.homeTeamId]?.ownerUserId;
    const awayOwnerId =
      teamsForCancelQuery.data?.[displayMatch.awayTeamId]?.ownerUserId;
    return Boolean(
      (homeOwnerId && homeOwnerId === userId) ||
        (awayOwnerId && awayOwnerId === userId),
    );
  }, [context, displayMatch, isOwner, userId, teamsForCancelQuery.data]);

  const onConfirmCancelMatch = useCallback(async () => {
    if (
      !displayMatch ||
      typeof displayMatch !== "object" ||
      !("id" in displayMatch)
    ) {
      return;
    }
    if (!canCancelMatch) return;
    const mid = displayMatch.id as string;
    try {
      if (context === "league") {
        await cancelLeagueMutation.mutateAsync({ matchId: mid });
        await queryClient.invalidateQueries({
          queryKey: ["league-matches", contextId],
        });
      } else {
        await cancelTeamMutation.mutateAsync({ matchId: mid });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["team-match", mid] }),
          queryClient.invalidateQueries({
            queryKey: ["team-matches", contextId],
          }),
        ]);
      }
    } catch (err) {
      Alert.alert("Cancel failed", errorToString(err));
    }
  }, [
    displayMatch,
    canCancelMatch,
    context,
    contextId,
    cancelLeagueMutation,
    cancelTeamMutation,
    queryClient,
  ]);

  const venueId = displayMatch?.venueId ?? "";
  const isLeagueContextMatch = Boolean(
    displayMatch && "leagueId" in displayMatch,
  );
  const teamVenueQuery = useTeamVenue(
    venueId,
    Boolean(venueId) && !isLeagueContextMatch,
  );
  const leagueVenueQuery = useLeagueVenue(
    venueId,
    Boolean(venueId) && isLeagueContextMatch,
  );
  const venue = isLeagueContextMatch
    ? leagueVenueQuery.data
    : teamVenueQuery.data;
  const { homeScore, awayScore } = getMatchScores(displayMatch);
  const HomeName = params.homeName?.trim() || "Home Team";
  const AwayName = params.awayName?.trim() || "Away Team";
  const HomeLogoUrl = params.homeLogoUrl?.trim() || undefined;
  const AwayLogoUrl = params.awayLogoUrl?.trim() || undefined;
  const teamContextLeagueId = getTeamContextLeagueId(context, displayMatch);
  const { data: teamContextLeagueMap } = useLeaguesByIds(
    teamContextLeagueId ? [teamContextLeagueId] : [],
  );
  const contextLabel = getContextLabel({
    context,
    leagueName: league?.name,
    teamContextLeagueId,
    teamContextLeagueMap,
  });
  const { homeTeam, awayTeam, refereeName } =
    useMatchPresentation(displayMatch);
  const HomeTeamName = homeTeam?.name ?? HomeName;
  const AwayTeamName = awayTeam?.name ?? AwayName;
  const HomeTeamLogoUrl = homeTeam?.logoUrl ?? HomeLogoUrl;
  const AwayTeamLogoUrl = awayTeam?.logoUrl ?? AwayLogoUrl;
  const isMatchLoading = getIsMatchLoading({
    context,
    teamMatchLoading: teamMatchQuery.isLoading,
    teamMatchesLoading: teamMatchesQuery.isLoading,
  });
  const loadingState = renderMatchLoadingState(isMatchLoading, displayMatch);

  if (loadingState) {
    return loadingState;
  }

  if (!displayMatch) {
    return <Text style={styles.empty}>Match not found</Text>;
  }

  return (
    <MatchDetailsContent
      startTime={displayMatch.startTime}
      status={displayMatch.status}
      canCancelMatch={canCancelMatch}
      onConfirmCancelMatch={canCancelMatch ? onConfirmCancelMatch : undefined}
      homeTeamName={HomeTeamName}
      awayTeamName={AwayTeamName}
      homeScore={homeScore}
      awayScore={awayScore}
      homeTeamLogoUrl={HomeTeamLogoUrl}
      awayTeamLogoUrl={AwayTeamLogoUrl}
      sport={displayMatch.sport}
      contextLabel={contextLabel}
      refereeName={refereeName}
      venueName={venue?.name ?? displayMatch.matchLocation}
      venueLocationLabel={venue ? `${venue.city}, ${venue.province}` : null}
      venueAddress={
        venue
          ? `${venue.street}, ${venue.city}, ${venue.province} ${venue.postalCode}, ${venue.country}`
          : null
      }
      venueLatitude={venue?.latitude}
      venueLongitude={venue?.longitude}
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
