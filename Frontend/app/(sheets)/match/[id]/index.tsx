import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import { MatchDetailsContent } from "@/components/matches/match-details-content";
import { useMatchPresentation } from "@/hooks/use-match-presentation";
import {
  useLeaguesByIds,
  useLeagueMatches,
  useTeamMatches,
  useTeamMatch,
} from "@/hooks/use-matches";

function getTeamContextLeagueId(
  context: "team" | "league",
  displayMatch: unknown,
): string {
  if (context !== "team" || !displayMatch) {
    return "";
  }

  if (
    typeof displayMatch === "object" &&
    "leagueId" in displayMatch &&
    typeof displayMatch.leagueId === "string"
  ) {
    return displayMatch.leagueId;
  }

  return "";
}

function getContextLabel({
  context,
  leagueName,
  teamContextLeagueId,
  teamContextLeagueMap,
}: {
  context: "team" | "league";
  leagueName?: string;
  teamContextLeagueId: string;
  teamContextLeagueMap?: Record<string, { name?: string }>;
}): string {
  if (context === "league") {
    return leagueName ?? "League Match";
  }

  if (teamContextLeagueId) {
    return teamContextLeagueMap?.[teamContextLeagueId]?.name ?? "League Match";
  }

  return "Team Match";
}

function getIsMatchLoading({
  context,
  teamMatchLoading,
  teamMatchesLoading,
}: {
  context: "team" | "league";
  teamMatchLoading: boolean;
  teamMatchesLoading: boolean;
}): boolean {
  if (context === "league") {
    return false;
  }

  return teamMatchLoading || teamMatchesLoading;
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

  const { league } = useLeagueDetail(context === "league" ? contextId : "");

  const displayMatch = leagueMatch || match;
  const displayMatchWithScore = displayMatch as
    | (typeof displayMatch & {
        homeScore?: number | null;
        awayScore?: number | null;
      })
    | undefined;
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

  return (
    <MatchDetailsContent
      startTime={displayMatch.startTime}
      status={displayMatch.status}
      homeTeamName={HomeTeamName}
      awayTeamName={AwayTeamName}
      homeScore={displayMatchWithScore?.homeScore}
      awayScore={displayMatchWithScore?.awayScore}
      homeTeamLogoUrl={HomeTeamLogoUrl}
      awayTeamLogoUrl={AwayTeamLogoUrl}
      sport={displayMatch.sport}
      contextLabel={contextLabel}
      refereeName={refereeName}
      venueName={displayMatch.matchLocation}
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
