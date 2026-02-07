import { useState } from "react";
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
  const {
    id,
    isLoading,
    refreshing,
    onRefresh,
    handleFollow,
    title,
    isMember,
    role,
    team,
  } = useTeamDetailContext();
  // TODO: change to role === "COACH" || role === "MANAGER" after testing since we cant change roles yet
  const canPost = role === "OWNER";

  const {
    data: boardPosts = [],
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useTeamBoardPosts(id);

  const visiblePosts = isMember
    ? boardPosts
    : boardPosts.filter((post) => post.scope === "Everyone");

  const deletePostMutation = useDeleteBoardPost(id);

  useTeamHeader({ title, id, isMember, onFollow: handleFollow });

  const handleDeletePost = (postId: string) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deletePostMutation.mutateAsync(postId);
          } catch (err) {
            Alert.alert("Failed to delete", errorToString(err));
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleRefresh = async () => {
    await onRefresh();
    await refetchPosts();
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
          values={["Board", "Overview", "Games"]}
          selectedIndex={tab === "board" ? 0 : tab === "overview" ? 1 : 2}
          onValueChange={(value) => {
            if (value === "Board") setTab("board");
            if (value === "Overview") setTab("overview");
            if (value === "Games") setTab("games");
          }}
          style={{ height: 40 }}
        />

        {isLoading || refreshing ? (
          <View style={styles.container}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <>
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
                canDelete={canPost}
              />
            )}

            {tab === "overview" && (
              <Text style={{ color: "white" }}>Overview content here</Text>
            )}

            {tab === "games" && (
              <Text style={{ color: "white" }}>Games content here</Text>
            )}
          </>
        )}
      </ContentArea>

      {/* Create Post Button */}
      {canPost && tab === "board" && (
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
