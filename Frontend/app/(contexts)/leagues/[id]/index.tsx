import React, { useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { ContentArea } from "@/components/ui/content-area";
import { Button } from "@/components/ui/button";
import { useLeagueHeader } from "@/hooks/use-team-league-header";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import { MatchListSections } from "@/components/matches/match-list-sections";
import { matchStyles } from "@/components/matches/match-styles";
import { useLeagueMatches, useTeamsByIds } from "@/hooks/use-matches";
import {
  getMatchSection,
  sortPastLatestFirst,
  sortUpcomingFirst,
} from "@/features/matches/utils";

export default function LeagueScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  return (
    <LeagueDetailProvider id={id}>
      <LeagueContent />
    </LeagueDetailProvider>
  );
}

function LeagueContent() {
  const router = useRouter();
  const [fabOpen, setFabOpen] = useState(false);
  const {
    id,
    onRefresh,
    title,
    isMember,
    isOwner,
    league,
    refreshing,
    handleFollow,
  } = useLeagueDetailContext();

  useLeagueHeader({ title, id, isMember, isOwner, onFollow: handleFollow });

  const {
    data: matches = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLeagueMatches(id);

  const teamIds = useMemo(
    () =>
      Array.from(
        new Set(matches.flatMap((match) => [match.homeTeamId, match.awayTeamId])),
      ),
    [matches],
  );
  const teamsQuery = useTeamsByIds(teamIds);

  const matchItems = useMemo(
    () =>
      matches.map((match) => {
        const home = teamsQuery.data?.[match.homeTeamId];
        const away = teamsQuery.data?.[match.awayTeamId];
        const section = getMatchSection(
          match.startTime,
          match.endTime,
          match.status,
        );
        return {
          id: match.id,
          homeName: home?.name ?? "Home Team",
          awayName: away?.name ?? "Away Team",
          homeLogoUrl: home?.logoUrl,
          awayLogoUrl: away?.logoUrl,
          sport: match.sport,
          contextLabel: league?.name ?? "League Match",
          status: match.status,
          startTime: match.startTime,
          section,
          isPast: section === "past",
        };
      }),
    [league?.name, matches, teamsQuery.data],
  );

  const current = sortUpcomingFirst(
    matchItems.filter((match) => match.section === "current"),
  );
  const upcoming = sortUpcomingFirst(
    matchItems.filter((match) => match.section === "upcoming"),
  );
  const past = sortPastLatestFirst(matchItems.filter((match) => match.isPast));

  return (
    <View style={{ flex: 1 }}>
      <ContentArea
        scrollable
        paddingBottom={100}
        backgroundProps={{ preset: "red" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isFetching}
            onRefresh={async () => {
              await Promise.all([onRefresh(), refetch()]);
            }}
            tintColor="#fff"
          />
        }
      >
        {(isLoading || teamsQuery.isLoading) && matches.length === 0 ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : null}

        <MatchListSections
          current={current}
          upcoming={upcoming}
          past={past}
          isLoading={isLoading || teamsQuery.isLoading}
          errorText={error ? "Could not load matches." : null}
          onRetry={() => {
            refetch();
            teamsQuery.refetch();
          }}
          onMatchPress={(matchId) => router.push(`/leagues/${id}/matches/${matchId}`)}
        />
      </ContentArea>

      {isOwner ? (
        <View style={matchStyles.fabWrap}>
          {fabOpen ? (
            <Card>
              <View style={matchStyles.fabMenu}>
                <Button
                  type="custom"
                  label="Create a Post"
                  onPress={() => {
                    setFabOpen(false);
                    router.push({
                      pathname: "/post",
                      params: {
                        id,
                        privacy: league?.privacy,
                      },
                    });
                  }}
                />
                <Button
                  type="custom"
                  label="Schedule a Match"
                  onPress={() => {
                    setFabOpen(false);
                    router.push(`/leagues/${id}/matches/schedule`);
                  }}
                />
              </View>
            </Card>
          ) : null}

          <View style={{ width: 56, height: 56 }}>
            <Button
              type="custom"
              icon={fabOpen ? "xmark" : "plus"}
              onPress={() => setFabOpen((v) => !v)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
