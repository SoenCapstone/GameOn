import React, { useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { ContentArea } from "@/components/ui/content-area";
import { Button } from "@/components/ui/button";
import { getSportLogo } from "@/components/browse/utils";
import { useTeamHeader } from "@/hooks/use-team-league-header";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { useTeamBoardPosts, useDeleteBoardPost } from "@/hooks/use-team-board";
import { BoardList } from "@/components/board/board-list";
import { useDetailPageHandlers } from "@/hooks/use-detail-page-handlers";
import { MatchListSections } from "@/components/matches/match-list-sections";
import { useTeamMatches, useTeamsByIds } from "@/hooks/use-matches";
import {
  buildMatchCards,
  splitMatchSections,
} from "@/features/matches/utils";

type TeamTab = "board" | "overview" | "games";

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
  const [tab, setTab] = useState<TeamTab>("board");
  const router = useRouter();

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

  useTeamHeader({ title, id, isMember, onFollow: handleFollow });

  const { data: boardPosts = [], isLoading: postsLoading, refetch: refetchPosts } =
    useTeamBoardPosts(id);
  const deletePostMutation = useDeleteBoardPost(id);

  const {
    data: matches = [],
    isLoading: matchesLoading,
    isFetching: matchesFetching,
    error: matchesError,
    refetch: refetchMatches,
  } = useTeamMatches(id);

  const teamIds = useMemo(
    () => Array.from(new Set(matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))),
    [matches],
  );
  const teamsQuery = useTeamsByIds(teamIds);

  const matchItems = useMemo(
    () => buildMatchCards(matches, teamsQuery.data, "Team Match"),
    [matches, teamsQuery.data],
  );

  const { current: currentMatches, upcoming: upcomingMatches, past: pastMatches } = useMemo(
    () => splitMatchSections(matchItems),
    [matchItems],
  );

  const { refreshing, handleDeletePost, handleRefresh } = useDetailPageHandlers({
    id,
    currentTab: tab,
    boardPosts,
    onRefresh,
    refetchPosts,
    deletePostMutation,
    entityName: "Team",
  });

  return (
    <View style={{ flex: 1 }}>
      <ContentArea
        scrollable
        paddingBottom={20}
        segmentedControl
        backgroundProps={{ preset: "red" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || matchesFetching}
            onRefresh={async () => {
              await handleRefresh();
              if (tab === "games") {
                await Promise.all([refetchMatches(), teamsQuery.refetch()]);
              }
            }}
            tintColor="#fff"
          />
        }
      >
        <SegmentedControl
          values={["Board", "Overview", "Games"]}
          selectedIndex={tab === "board" ? 0 : tab === "overview" ? 1 : 2}
          onValueChange={(value) => {
            if (value === "Board") setTab("board");
            else if (value === "Overview") setTab("overview");
            else setTab("games");
          }}
          style={{ height: 40 }}
        />

        {isLoading ? (
          <View style={styles.container}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : null}

        {tab === "board" ? (
          <BoardList
            posts={boardPosts}
            isLoading={postsLoading}
            spaceName={team?.name ?? title}
            spaceLogo={team?.logoUrl ? { uri: team.logoUrl } : getSportLogo(team?.sport)}
            onDeletePost={handleDeletePost}
            canDelete={canManage}
          />
        ) : null}

        {tab === "overview" ? (
          <View>
            <Text style={{ color: "white", padding: 16 }}>Overview content here</Text>
            {canManage ? (
              <Button
                type="custom"
                label="Open Playmaker"
                onPress={() => router.push(`/playmaker/${id}`)}
              />
            ) : null}
          </View>
        ) : null}

        {tab === "games" ? (
          <MatchListSections
            current={currentMatches}
            upcoming={upcomingMatches}
            past={pastMatches}
            isLoading={matchesLoading || teamsQuery.isLoading}
            errorText={matchesError ? "Could not load matches." : null}
            onRetry={() => {
              refetchMatches();
              teamsQuery.refetch();
            }}
            onMatchPress={(matchId) => router.push(`/teams/${id}/matches/${matchId}`)}
          />
        ) : null}
      </ContentArea>

      {canManage && tab === "board" ? (
        <View style={styles.fab}>
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
        <View style={styles.fab}>
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
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
});
