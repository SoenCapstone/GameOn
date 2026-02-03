import React, { useState } from "react";
import { View, ActivityIndicator, RefreshControl, Alert, Text, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { Button } from "@/components/ui/button";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { createTeamStyles } from "@/components/teams/teams-styles";
import { useTeamHeader } from "@/hooks/use-team-league-header";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { useTeamBoardPosts, useCreateBoardPost, useDeleteBoardPost } from "@/hooks/use-team-board";
import { TeamBoardList } from "@/components/teams/team-board-list";
import { BoardCreateModal } from "@/components/teams/board-create-modal";
import { errorToString } from "@/utils/error";
import { BoardPostType, BoardPostScope } from "@/components/teams/team-board-types";
import Icon from 'react-native-vector-icons/Ionicons';
import { GlassView } from "expo-glass-effect";

export default function TeamScreen() {
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
  const [tab, setTab] = React.useState<"board" | "overview" | "games">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const { id, isLoading, refreshing, onRefresh, handleFollow, title, isMember, role } =
    useTeamDetailContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // TODO: change to role === "COACH" || role === "MANAGER" after testing since we cant change roles yet
  const canPost = role === "OWNER";

  const {
    data: boardPosts = [],
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useTeamBoardPosts(id);

  const visiblePosts = isMember
    ? boardPosts
    : boardPosts.filter((post) => post.scope === "everyone");

  const createPostMutation = useCreateBoardPost(id);
  const deletePostMutation = useDeleteBoardPost(id);

  useTeamHeader({ title, id, isMember, onFollow: handleFollow });

  const handleCreatePost = async (type: BoardPostType, scope: BoardPostScope, content: string) => {
    try {
      await createPostMutation.mutateAsync({
        teamId: id,
        type,
        scope,
        content,
      });
      Alert.alert("Success", "Post created");
    } catch (err) {
      Alert.alert("Failed to post", errorToString(err));
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: async () => {
            setDeletingPostId(postId);
            try {
              await deletePostMutation.mutateAsync(postId);
              Alert.alert("Success", "Post deleted");
            } catch (err) {
              Alert.alert("Failed to delete", errorToString(err));
            } finally {
              setDeletingPostId(null);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleRefresh = async () => {
    await onRefresh();
    await refetchPosts();
  };

  return (
    <ContentArea
      scrollable
      paddingBottom={60}
      backgroundProps={{ preset: "red" }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#fff"
        />
      }
    >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            {refreshing && <ActivityIndicator size="small" color="#fff" />}
            <SegmentedControl
              values={["Board", "Overview", "Games"]}
              selectedIndex={tab === "board" ? 0 : tab === "overview" ? 1 : 2}
              onValueChange={(value) => {
                if (value === "Board") setTab("board");
                if (value === "Overview") setTab("overview");
                if (value === "Games") setTab("games");
              }}
              style={{ alignSelf: "center", width: "90%" }}
            />

            {tab === "board" && (
              <View style={styles.boardSection}>
                <GlassView isInteractive style={styles.searchContainer}>
                  <Icon name="search" size={20} color="#888" style={styles.icon} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    style={styles.searchInput}
                  />
                </GlassView>
                <TeamBoardList
                  posts={visiblePosts}
                  isLoading={postsLoading}
                  canPost={canPost}
                  onDeletePost={handleDeletePost}
                  isDeletingId={deletingPostId ?? undefined}
                />
              </View>
            )}

            {tab === "overview" && (
              <Text style={{ color: "white" }}>Overview content here</Text>
            )}

            {tab === "games" && (
              <Text style={{ color: "white" }}>Games content here</Text>
            )}
          </>
        )}

      {/* Create Post Button */}
      {canPost && tab === "board" && (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
          }}
        >
          <Button
            type="custom"
            icon="plus"
            onPress={() => setShowCreateModal(true)}
          />
        </View>
      )}

      <BoardCreateModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePost}
        isLoading={createPostMutation.isPending}
      />
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  boardSection: {
    width: "100%",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: "90%",
    alignSelf: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  searchInput: {
    flex: 1,
    width: "100%",
    height: 40,
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 14,
  },
   icon: {
    marginLeft: 6,
  },
});
