import React from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { BoardPost } from "@/components/teams/team-board-types";
import { BoardPostCard } from "@/components/teams/board-post-card";

interface TeamBoardListProps {
  posts: BoardPost[];
  isLoading: boolean;
  canPost: boolean;
  onDeletePost: (postId: string) => void;
  isDeletingId?: string;
}

export function TeamBoardList({
  posts,
  isLoading,
  canPost,
  onDeletePost,
  isDeletingId,
}: Readonly<TeamBoardListProps>) {
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No announcements yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <BoardPostCard
          post={item}
          canPost={canPost}
          onDelete={onDeletePost}
          isDeleting={isDeletingId === item.id}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
  },
  list: {
    gap: 12,
  },
});