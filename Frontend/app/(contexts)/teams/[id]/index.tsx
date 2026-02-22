import { useState, useCallback, useMemo } from "react";
import { useState } from "react";
import {
  View,
  ActivityIndicator,
  RefreshControl,
  Text,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { Button } from "@/components/ui/button";
import { getSportLogo } from "@/components/browse/utils";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useTeamHeader } from "@/hooks/use-team-league-header";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { useTeamBoardPosts, useDeleteBoardPost } from "@/hooks/use-team-board";
import { BoardList } from "@/components/board/board-list";
import { useDetailPageHandlers } from "@/hooks/use-detail-page-handlers";
import { createScopedLog } from "@/utils/logger";
import { MatchListSections } from "@/components/matches/match-list-sections";
import { useTeamMatches, useTeamsByIds } from "@/hooks/use-matches";
import {
  getMatchSection,
  sortPastLatestFirst,
  sortUpcomingFirst,
} from "@/features/matches/utils";

export default function Team() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  return (
    <TeamDetailProvider id={id}>
      <TeamContent />
    </TeamDetailProvider>
  );
}

function TeamContent() {
  const [tab, setTab] = useState<"board" | "overview" | "games">("board");
  const router = useRouter();
  const log = createScopedLog("Team Page");

  const {
    id,
    isLoading,
    onRefresh,
    handleFollow,
    title,
    isMember,
    isOwner,
    isActiveMember,
    role,
    team,
  } = useTeamDetailContext();
  const canManage =
    (isActiveMember && role === "OWNER") || role === "COACH" || role === "MANAGER";
  const log = createScopedLog("Team Page");
    (isActiveMember && role === "OWNER") ||
    role === "COACH" ||
    role === "MANAGER";

  const {
    data: boardPosts = [],
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useTeamBoardPosts(id);

  const deletePostMutation = useDeleteBoardPost(id);

  const {
    data: matches = [],
    isLoading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
  } = useTeamMatches(id);

  const matchTeamIds = useMemo(
    () =>
      Array.from(
        new Set(matches.flatMap((match) => [match.homeTeamId, match.awayTeamId])),
      ),
    [matches],
  );
  const matchTeamsQuery = useTeamsByIds(matchTeamIds);

  const matchItems = useMemo(
    () =>
      matches.map((match) => {
        const home = matchTeamsQuery.data?.[match.homeTeamId];
        const away = matchTeamsQuery.data?.[match.awayTeamId];
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
          contextLabel: "Team Match",
          status: match.status,
          startTime: match.startTime,
          section,
          isPast: section === "past",
        };
      }),
    [matchTeamsQuery.data, matches],
  );

  const currentMatches = sortUpcomingFirst(
    matchItems.filter((match) => match.section === "current"),
  );
  const upcomingMatches = sortUpcomingFirst(
    matchItems.filter((match) => match.section === "upcoming"),
  );
  const pastMatches = sortPastLatestFirst(matchItems.filter((match) => match.isPast));

  useTeamHeader({ title, id, isMember, onFollow: handleFollow });

  const { refreshing, handleDeletePost, handleRefresh } = useDetailPageHandlers(
    {
      id,
      currentTab: tab,
      boardPosts,
      onRefresh,
      refetchPosts,
      deletePostMutation,
      entityName: "Team",
    },
  );

  const getTabFromSegmentValue = (
    value: string,
  ): "board" | "overview" | "games" => {
    if (value === "Board") return "board";
    if (value === "Overview") return "overview";
    return "games";
  };

  const getSelectedIndex = (): number => {
    if (tab === "board") return 0;
    if (tab === "overview") return 1;
    return 2;
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      {
        text: "Cancel",
        onPress: () => log.info("Delete post cancelled", { postId }),
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deletePostMutation.mutateAsync(postId);
            log.info("Post deleted", { postId });
          } catch (err) {
            log.error("Failed to delete post", {
              postId,
              error: errorToString(err),
            });
            Alert.alert("Failed to delete", errorToString(err));
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await onRefresh();
      if (tab === "board") {
        await refetchPosts();
        log.info("Board posts refreshed", { postCount: boardPosts.length });
      }
      if (tab === "games") {
        await Promise.all([refetchMatches(), matchTeamsQuery.refetch()]);
        log.info("Team matches refreshed", { matchCount: matches.length });
      }
    } catch (err) {
      log.error("Refresh failed", { error: errorToString(err), tab });
    } finally {
      setRefreshing(false);
    }
  }, [
    boardPosts.length,
    log,
    matchTeamsQuery,
    matches.length,
    onRefresh,
    refetchMatches,
    refetchPosts,
    tab,
  ]);

  return (
    <View style={{ flex: 1 }}>
      <ContentArea
        scrollable
        paddingBottom={20}
        segmentedControl
        backgroundProps={{ preset: "red" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
      >
        <SegmentedControl
          values={["Board", "Overview", "Games"]}
          selectedIndex={getSelectedIndex()}
          onValueChange={(value) => {
            const newTab = getTabFromSegmentValue(value);
            setTab(newTab);
            log.info("Tab changed", { tab: newTab });
          }}
          style={{ height: 40 }}
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
                spaceName={team?.name ?? title}
                spaceLogo={
                  team?.logoUrl ? { uri: team.logoUrl } : getSportLogo(team?.sport)
                }
                onDeletePost={handleDeletePost}
                canDelete={canManage}
              />
            )}

            {tab === "overview" && (
              <View>
                <Text style={{ color: "white", padding: 16 }}>Overview content here</Text>
                {canManage && (
                  <Button
                    type="custom"
                    label="Open Playmaker"
                    onPress={() => router.push(`/playmaker/${id}`)}
                  />
                )}
              </View>
            )}

            {tab === "games" && (
              <MatchListSections
                current={currentMatches}
                upcoming={upcomingMatches}
                past={pastMatches}
                isLoading={matchesLoading || matchTeamsQuery.isLoading}
                errorText={matchesError ? "Could not load matches." : null}
                onRetry={() => {
                  refetchMatches();
                  matchTeamsQuery.refetch();
                }}
                onMatchPress={(matchId) => router.push(`/teams/${id}/matches/${matchId}`)}
              />
            )}
          </>
        )}
      </ContentArea>

      {canManage && tab === "board" ? (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
          }}
        >
          <Button
            type="custom"
            icon="plus"
            onPress={() =>
              router.push({
                pathname: "/post",
                params: {
                  id,
                  spaceType: "team",
                  privacy: team?.privacy,
                },
              })
            }
          />
        </View>
      ) : null}

      {isOwner && tab === "games" ? (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
          }}
        >
          <Button
            type="custom"
            icon="plus"
            onPress={() => router.push(`/teams/${id}/matches/schedule`)}
          />
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
});
