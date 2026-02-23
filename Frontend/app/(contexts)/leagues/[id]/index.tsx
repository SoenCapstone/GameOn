import React, { useMemo, useState } from "react";
import {
  View,
  ActivityIndicator,
  RefreshControl,
  Text,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
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

type LeagueTab = "board" | "matches" | "teams";

// NOTE: order matters (index mapping for SegmentedControl)
const LEAGUE_TABS: readonly LeagueTab[] = ["board", "matches", "teams"] as const;

const TAB_LABELS: Record<LeagueTab, string> = {
  board: "Board",
  matches: "Matches",
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

  const selectedIndex = useMemo(() => LEAGUE_TABS.indexOf(tab), [tab]);

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
          values={LEAGUE_TABS.map((t) => TAB_LABELS[t])}
          selectedIndex={selectedIndex}
          onChange={(event) => {
            const index = event.nativeEvent.selectedSegmentIndex;
            const nextTab = LEAGUE_TABS[index] ?? "board";
            setTab(nextTab);
            log.info("Tab changed", { tab: nextTab });
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
              <View>
                <Text style={{ color: "white", padding: 16 }}>
                  Matches content here
                </Text>
              </View>
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

      {/* Create Post Button */}
      {isOwner && tab === "board" && (
        <View style={styles.fabWrap}>
          <Button
            type="custom"
            icon="plus"
            onPress={() =>
              router.push({
                pathname: "/post",
                params: {
                  id,
                  spaceType: "league",
                  privacy: league?.privacy,
                },
              })
            }
          />
        </View>
      )}
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