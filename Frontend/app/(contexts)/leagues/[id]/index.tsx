import { useState } from "react";
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
  const [tab, setTab] = useState<"board" | "matches">("board");
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
  } = useLeagueDetailContext();

  const {
    data: boardPosts = [],
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useLeagueBoardPosts(id);

  const deletePostMutation = useDeleteLeagueBoardPost(id);

  useLeagueHeader({ title, id, isMember, isOwner, onFollow: handleFollow });

  const {
    refreshing,
    handleDeletePost,
    handleRefresh,
  } = useDetailPageHandlers({
    id,
    currentTab: tab,
    boardPosts,
    onRefresh,
    refetchPosts,
    deletePostMutation,
    entityName: "League",
  });

  const getTabFromSegmentValue = (
    value: string,
  ): "board" | "matches" => {
    if (value === "Board") return "board";
    return "matches";
  };

  const getSelectedIndex = (): number => {
    if (tab === "board") return 0;
    return 1;
  };

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
          values={["Board", "Matches"]}
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
          </>
        )}
      </ContentArea>

      {/* Create Post Button */}
      {isOwner && tab === "board" && (
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
});
