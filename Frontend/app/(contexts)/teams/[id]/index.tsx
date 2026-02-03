import React, { useState } from "react";
import { View, ActivityIndicator, RefreshControl, Alert, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { Button } from "@/components/ui/button";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useTeamHeader } from "@/hooks/use-team-league-header";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { useTeamBoardPosts, useCreateBoardPost, useDeleteBoardPost, useUpdateBoardPost } from "@/hooks/use-team-board";
import { TeamBoardList } from "@/components/teams/team-board-list";
import { BoardCreateModal } from "@/components/teams/board-create-modal";
import { errorToString } from "@/utils/error";
import { BoardPostType, BoardPostScope, BoardPost } from "@/components/teams/team-board-types";

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
  const [editingPost, setEditingPost] = useState<BoardPost | null>(null);
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
  const updatePostMutation = useUpdateBoardPost(id);
  const deletePostMutation = useDeleteBoardPost(id);

  useTeamHeader({ title, id, isMember, onFollow: handleFollow });

  const handleCreatePost = async (type: BoardPostType, scope: BoardPostScope, content: string) => {
    try {
      if (editingPost) {
        await updatePostMutation.mutateAsync({
          postId: editingPost.id,
          type,
          scope,
          content,
        });
        Alert.alert("Success", "Post updated");
        setEditingPost(null);
      } else {
        await createPostMutation.mutateAsync({
          teamId: id,
          type,
          scope,
          content,
        });
        Alert.alert("Success", "Post created");
      }
    } catch (err) {
      Alert.alert(editingPost ? "Failed to update" : "Failed to post", errorToString(err));
    }
  };

  const handleEditPost = (post: BoardPost) => {
    setEditingPost(post);
    setShowCreateModal(true);
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
    <View style={{flex: 1}}>
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
              style={{ alignSelf: "center", width: "100%" }}
            />

            {tab === "board" && (
              <TeamBoardList
                posts={visiblePosts}
                isLoading={postsLoading}
                canPost={canPost}
                onEditPost={handleEditPost}
                onDeletePost={handleDeletePost}
                isDeletingId={deletingPostId ?? undefined}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
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

      

      <BoardCreateModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingPost(null);
        }}
        onSubmit={handleCreatePost}
        isLoading={createPostMutation.isPending || updatePostMutation.isPending}
        editPost={editingPost}
      />
    </ContentArea>

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
    </View>
  );
}
