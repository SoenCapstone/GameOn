import { useMemo, useState } from "react";
import {
  View,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { getSportLogo } from "@/components/browse/utils";
import { Button } from "@/components/ui/button";
import { LeagueBrowserTeams } from "@/components/leagues/league-browser-teams";
import { useLeagueHeader } from "@/hooks/use-team-league-header";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import {
  useLeagueBoardPosts,
  useDeleteLeagueBoardPost,
} from "@/hooks/use-league-board";
import { BoardList } from "@/components/board/board-list";
import { useDetailPageHandlers } from "@/hooks/use-detail-page-handlers";
import { createScopedLog } from "@/utils/logger";
import { MatchListSections } from "@/components/matches/match-list-sections";
import { matchStyles } from "@/components/matches/match-styles";
import { useLeagueMatches, useTeamsByIds } from "@/hooks/use-matches";
import {
  buildMatchCards,
  splitMatchSections,
} from "@/features/matches/utils";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";

type LeagueTab = "board" | "matches" | "standings" | "teams";

const LeagueTabs: readonly LeagueTab[] = ["board", "matches", "standings", "teams"] as const;

const TabLabels: Record<LeagueTab, string> = {
  board: "Board",
  matches: "Matches",
  standings: "Standings",
  teams: "Teams",
};

export default function LeagueScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  return (
    <LeagueDetailProvider id={id}>
      <LeagueContent />
    </LeagueDetailProvider>
  );
}

function LeagueContent() {
  const [tab, setTab] = useState<LeagueTab>("board");
  const [fabOpen, setFabOpen] = useState(false);
  const router = useRouter();
  const log = createScopedLog("League Page");

  const {
    id,
    isLoading,
    onRefresh,
    handleFollow,
    title,
    isMember,
    isOwner,
    league,
    leagueTeams,
    isLeagueTeamsLoading,
    leagueTeamsError,
  } = useLeagueDetailContext();

  const {
    data: boardPosts = [],
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useLeagueBoardPosts(id);

  const deletePostMutation = useDeleteLeagueBoardPost(id);

   const {
    data: matches = [],
    isLoading: matchesLoading,
    isFetching: matchesFetching,
    error: matchesError,
    refetch: refetchMatches,
  } = useLeagueMatches(id);

  const teamIds = useMemo(
    () => Array.from(new Set(matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))),
    [matches],
  );

   const teamsQuery = useTeamsByIds(teamIds);

  const matchItems = useMemo(
    () => buildMatchCards(matches, teamsQuery.data, league?.name ?? "League Match"),
    [league?.name, matches, teamsQuery.data],
  );

  const { current, upcoming, past } = useMemo(
    () => splitMatchSections(matchItems),
    [matchItems],
  );

  useLeagueHeader({ title, id, isMember, isOwner, onFollow: handleFollow });

  const { refreshing, handleDeletePost, handleRefresh } = useDetailPageHandlers({
    id,
    currentTab: tab,
    boardPosts,
    onRefresh,
    refetchPosts,
    deletePostMutation,
    entityName: "League",
  });

  const selectedIndex = useMemo(() => LeagueTabs.indexOf(tab), [tab]);

  return (
    <View style={{ flex: 1 }}>
      <ContentArea
        scrollable
        paddingBottom={20}
        tabs
        backgroundProps={{ preset: "red" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || matchesFetching}
            onRefresh={async () => {
              await handleRefresh();
              if (tab === "matches") {
                await Promise.all([refetchMatches(), teamsQuery.refetch()]);
              }
            }}
            tintColor="#fff"
          />
        }
      >
        <Tabs
          values={LeagueTabs.map((t) => TabLabels[t])}
          selectedIndex={selectedIndex}
          onValueChange={(value) => {
            const index = LeagueTabs.findIndex((t) => TabLabels[t] === value);
            const nextTab = index >= 0 ? LeagueTabs[index] : "board";
            setTab(nextTab);
            log.info("Tab changed", { tab: nextTab });
          }}
        />

        {isLoading ? (
          <View style={styles.container}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <>
            {refreshing && <ActivityIndicator size="small" color="#fff" />}

            {tab === "board" && (
              <BoardList
                posts={boardPosts}
                isLoading={postsLoading}
                spaceName={league?.name ?? title}
                spaceLogo={
                  league?.logoUrl
                    ? { uri: league.logoUrl }
                    : getSportLogo(league?.sport)
                }
                onDeletePost={handleDeletePost}
                canDelete={isOwner}
              />
            )}

            {tab === "matches" && (
            <MatchListSections
              current={current}
              upcoming={upcoming}
              past={past}
              isLoading={matchesLoading || teamsQuery.isLoading}
              errorText={matchesError ? "Could not load matches." : null}
              onRetry={() => {
                refetchMatches();
                teamsQuery.refetch();
              }}
              onMatchPress={(matchId) => router.push(`/leagues/${id}/matches/${matchId}`)}
            />
            )}

            {tab === "teams" && (
              <LeagueBrowserTeams
                leagueId={id}
                leagueTeams={leagueTeams ?? []}
                teamsFetching={Boolean(isLeagueTeamsLoading)}
                leagueTeamsError={leagueTeamsError}
              />
            )}
          </>
        )}
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
                      params: { id, spaceType: "league", privacy: league?.privacy },
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  fabWrap: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
});
