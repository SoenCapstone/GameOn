import { useMemo, useState } from "react";
import {
  View,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
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
import {
  useCancelLeagueMatch,
  useLeagueMatches,
  useTeamsByIds,
} from "@/hooks/use-matches";
import { buildMatchCards, splitMatchSections } from "@/features/matches/utils";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { errorToString } from "@/utils/error";
import { useLeagueStandings } from "@/hooks/use-league-standings";
import { LeagueStandings } from "@/components/leagues/league-standings";

type LeagueTab = "board" | "matches" | "standings" | "teams";

const LeagueTabs: readonly LeagueTab[] = [
  "board",
  "matches",
  "standings",
  "teams",
] as const;

const TabLabels: Record<LeagueTab, string> = {
  board: "Board",
  matches: "Matches",
  standings: "Standings",
  teams: "Teams",
};

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
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: LeagueTab = resolveLeagueTab(params.tab);
  const [tab, setTab] = useState<LeagueTab>(initialTab);
  const [fabOpen, setFabOpen] = useState(false);
  const router = useRouter();
  const log = createScopedLog("League Page");
  const queryClient = useQueryClient();
  const { userId } = useAuth();
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
    data: standings = [],
    isLoading: standingsLoading,
    error: standingsError,
    refetch: refetchStandings,
  } = useLeagueStandings(id);

  const {
    data: boardPosts = [],
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useLeagueBoardPosts(id);

  const deletePostMutation = useDeleteLeagueBoardPost(id);

  const {
    data: matches = [],
    isLoading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
  } = useLeagueMatches(id);
  const cancelLeagueMutation = useCancelLeagueMatch(id);

  const teamIds = useMemo(
    () =>
      Array.from(new Set(matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))),
    [matches],
  );

  const teamsQuery = useTeamsByIds(teamIds);

  const matchItems = useMemo(() => {
    const items = buildMatchCards(
      matches,
      teamsQuery.data,
      league?.name ?? "League Match",
    );

    return items.map((match) => {
      const homeOwnerId = teamsQuery.data?.[match.homeTeamId]?.ownerUserId;
      const awayOwnerId = teamsQuery.data?.[match.awayTeamId]?.ownerUserId;
      const isConfirmed = match.status === "CONFIRMED";
      const canCancel =
        !match.isPast && isOwner && match.status !== "CANCELLED";
      const isTeamOwner = Boolean(
        (homeOwnerId && homeOwnerId === userId) ||
          (awayOwnerId && awayOwnerId === userId),
      );
      const canSubmitScore = Boolean(
        userId &&
          isConfirmed &&
          (match.requiresReferee
            ? match.refereeUserId === userId
            : isTeamOwner),
      );

      return {
        ...match,
        canCancel,
        canSubmitScore,
        onConfirmCancel: canCancel
          ? async () => {
              try {
                await cancelLeagueMutation.mutateAsync({ matchId: match.id });
                await queryClient.invalidateQueries({
                  queryKey: ["league-matches", id],
                });
              } catch (err) {
                Alert.alert("Cancel failed", errorToString(err));
              }
            }
          : undefined,
        onSubmitScore: canSubmitScore
          ? () => {
              router.push({
                pathname: `/match/${match.id}/score` as RelativePathString,
                params: {
                  contextId: id,
                  contextType: "league",
                  leagueId: id,
                  startTime: match.startTime,
                  homeName: match.homeName,
                  awayName: match.awayName,
                },
              });
            }
          : undefined,
      };
    });
  }, [
    matches,
    teamsQuery.data,
    league?.name,
    isOwner,
    userId,
    cancelLeagueMutation,
    queryClient,
    id,
    router,
  ]);

  const { today, upcoming, past } = useMemo(
    () => splitMatchSections(matchItems),
    [matchItems],
  );

  const handleMatchesRefresh = useMemo(
    () => async () => {
      await Promise.all([refetchMatches(), teamsQuery.refetch()]);
    },
    [refetchMatches, teamsQuery],
  );

  useLeagueHeader({ title, id, isMember, isOwner, onFollow: handleFollow });

  const { refreshing, handleDeletePost, handleRefresh } = useDetailPageHandlers(
    {
      id,
      currentTab: tab,
      boardPosts,
      onRefresh,
      refetchPosts,
      refetchStandings,
      deletePostMutation,
      entityName: "League",
      onMatchesRefresh: handleMatchesRefresh,
    },
  );

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
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
            {refreshing && !isLoading && (
              <ActivityIndicator size="small" color="#fff" />
            )}

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
                today={today}
                upcoming={upcoming}
                past={past}
                isLoading={matchesLoading || teamsQuery.isLoading}
                errorText={matchesError ? "Could not load matches." : null}
                onRetry={handleMatchesRefresh}
                onMatchPress={(match) =>
                  router.push({
                    pathname:
                      `/(sheets)/match/${match.id}` as RelativePathString,
                    params: {
                      context: "league",
                      contextId: id,
                      homeName: match.homeName,
                      awayName: match.awayName,
                      homeLogoUrl: match.homeLogoUrl ?? "",
                      awayLogoUrl: match.awayLogoUrl ?? "",
                    },
                  })
                }
              />
            )}
            {tab === "standings" && (
              <LeagueStandings
                sport={league?.sport}
                standings={standings}
                isLoading={standingsLoading}
                error={standingsError ? "Could not load standings." : null}
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
        <View style={styles.fabWrap}>
          {fabOpen ? (
            <Card>
              <View style={styles.fabMenu}>
                <Button
                  type="custom"
                  label="Create a Post"
                  onPress={() => {
                    setFabOpen(false);
                    router.push({
                      pathname: "/post",
                      params: {
                        id,
                        spaceType: "league",
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

function resolveLeagueTab(tab?: string): LeagueTab {
  if (tab === "matches") return "matches";
  if (tab === "standings") return "standings";
  if (tab === "teams") return "teams";
  return "board";
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
    right: 20,
    bottom: 20,
    alignItems: "flex-end",
    gap: 10,
  },
  fabMenu: {
    borderRadius: 20,
    padding: 10,
    minWidth: 170,
    gap: 8,
  },
});
