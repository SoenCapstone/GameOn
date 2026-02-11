import { useState, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  RefreshControl,
  Alert,
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
import { errorToString } from "@/utils/error";
import { createScopedLog } from "@/utils/logger";

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
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const {
    id,
    isLoading,
    onRefresh,
    handleFollow,
    title,
    isActiveMember,
    role,
    team,
  } = useTeamDetailContext();
  const canManage = role === "OWNER" || role === "COACH" || role === "MANAGER";
  const log = createScopedLog("Team Page");

  const {
    data: boardPosts = [],
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useTeamBoardPosts(id);

  const visiblePosts = isActiveMember
    ? boardPosts
    : boardPosts.filter((post) => post.scope === "Everyone");

  const deletePostMutation = useDeleteBoardPost(id);

  useTeamHeader({ title, id, isActiveMember, onFollow: handleFollow });

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
        log.info("Board posts refreshed", { postCount: visiblePosts.length });
      } else {
        log.info("Team data refreshed", { tab });
      }
    } catch (err) {
      log.error("Refresh failed", { error: errorToString(err), tab });
    } finally {
      setRefreshing(false);
    }
  }, [log, onRefresh, refetchPosts, tab, visiblePosts.length]);

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
                posts={visiblePosts}
                isLoading={postsLoading}
                spaceName={team?.name ?? title}
                spaceLogo={
                  team?.logoUrl
                    ? { uri: team.logoUrl }
                    : getSportLogo(team?.sport)
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
              <Text style={{ color: "white" }}>Games content here</Text>
            )}
          </>
        )}
      </ContentArea>

      {/* Create Post Button */}
      {canManage && tab === "board" && (
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
                  privacy: team?.privacy,
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
