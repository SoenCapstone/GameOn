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
const TEAM_SEGMENT_VALUES = ["Board", "Overview", "Games"] as const;

function getRouteId(idParam: string | string[] | undefined): string {
  if (Array.isArray(idParam)) {
    return idParam[0] ?? "";
  }
  return idParam ?? "";
}

function getTeamTabFromSegment(value: string): TeamTab {
  if (value === "Board") return "board";
  if (value === "Overview") return "overview";
  return "games";
}

function getTeamSegmentIndex(tab: TeamTab): number {
  if (tab === "board") return 0;
  if (tab === "overview") return 1;
  return 2;
}

type TeamTabContentProps = {
  readonly tab: TeamTab;
  readonly boardPosts: readonly any[];
  readonly postsLoading: boolean;
  readonly teamName: string;
  readonly teamLogo: any;
  readonly handleDeletePost: (postId: string) => void;
  readonly canManage: boolean;
  readonly id: string;
  readonly router: ReturnType<typeof useRouter>;
  readonly currentMatches: readonly any[];
  readonly upcomingMatches: readonly any[];
  readonly pastMatches: readonly any[];
  readonly matchesLoading: boolean;
  readonly teamsLoading: boolean;
  readonly matchesError: unknown;
  readonly onRetryMatches: () => void;
};

function TeamTabContent(props: Readonly<TeamTabContentProps>) {
  const {
    tab,
    boardPosts,
    postsLoading,
    teamName,
    teamLogo,
    handleDeletePost,
    canManage,
    id,
    router,
    currentMatches,
    upcomingMatches,
    pastMatches,
    matchesLoading,
    teamsLoading,
    matchesError,
    onRetryMatches,
  } = props;

  if (tab === "board") {
    return (
      <BoardList
        posts={boardPosts}
        isLoading={postsLoading}
        spaceName={teamName}
        spaceLogo={teamLogo}
        onDeletePost={handleDeletePost}
        canDelete={canManage}
      />
    );
  }

  if (tab === "overview") {
    return (
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
    );
  }

  return (
    <MatchListSections
      current={currentMatches}
      upcoming={upcomingMatches}
      past={pastMatches}
      isLoading={matchesLoading || teamsLoading}
      errorText={matchesError ? "Could not load matches." : null}
      onRetry={onRetryMatches}
      onMatchPress={(matchId) => router.push(`/teams/${id}/matches/${matchId}`)}
    />
  );
}

export default function Team() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = getRouteId(params.id);

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

  const handleMatchesRefresh = useMemo(
    () => async () => {
      await Promise.all([refetchMatches(), teamsQuery.refetch()]);
    },
    [refetchMatches, teamsQuery],
  );

  const handleRefreshControl = useMemo(
    () => async () => {
      await handleRefresh();
      if (tab !== "games") return;
      await handleMatchesRefresh();
    },
    [handleMatchesRefresh, handleRefresh, tab],
  );

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
            onRefresh={handleRefreshControl}
            tintColor="#fff"
          />
        }
      >
        <SegmentedControl
          values={[...TEAM_SEGMENT_VALUES]}
          selectedIndex={getTeamSegmentIndex(tab)}
          onValueChange={(value) => setTab(getTeamTabFromSegment(value))}
          style={{ height: 40 }}
        />

        {isLoading ? (
          <View style={styles.container}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : null}

        <TeamTabContent
          tab={tab}
          boardPosts={boardPosts}
          postsLoading={postsLoading}
          teamName={team?.name ?? title}
          teamLogo={team?.logoUrl ? { uri: team.logoUrl } : getSportLogo(team?.sport)}
          handleDeletePost={handleDeletePost}
          canManage={canManage}
          id={id}
          router={router}
          currentMatches={currentMatches}
          upcomingMatches={upcomingMatches}
          pastMatches={pastMatches}
          matchesLoading={matchesLoading}
          teamsLoading={teamsQuery.isLoading}
          matchesError={matchesError}
          onRetryMatches={handleMatchesRefresh}
        />
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
