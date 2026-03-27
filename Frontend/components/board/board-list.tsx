import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { BoardPost } from "@/components/board/board-types";
import { Post } from "@/components/board/post";
import { LegendList } from "@legendapp/list/react-native";
import { ImageSource } from "expo-image";

interface BoardListProps {
  posts: BoardPost[];
  isLoading: boolean;
  spaceName: string;
  spaceLogo: ImageSource;
  onDeletePost?: (postId: string) => void;
  canDelete?: boolean;
}

export function BoardList({
  posts,
  isLoading,
  spaceName,
  spaceLogo,
  onDeletePost,
  canDelete = false,
}: Readonly<BoardListProps>) {
  const renderItem = React.useCallback(
    ({ item }: { item: BoardPost }) => {
      return (
        <Post
          post={item}
          spaceName={spaceName}
          spaceLogo={spaceLogo}
          onDelete={onDeletePost}
          canDelete={canDelete}
        />
      );
    },
    [canDelete, onDeletePost, spaceLogo, spaceName],
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <LegendList
      data={posts}
      keyExtractor={(item) => item?.id}
      style={styles.legendList}
      contentContainerStyle={styles.list}
      renderItem={renderItem}
      ListEmptyComponent={
        <View style={styles.container}>
          <Text style={styles.emptyText}>No posts available</Text>
        </View>
      }
      recycleItems={true}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
  },
  legendList: { overflow: "visible" },
  list: {
    gap: 12,
  },
});
