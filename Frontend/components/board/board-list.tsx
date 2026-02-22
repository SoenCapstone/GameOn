import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { BoardPost } from "@/components/board/board-types";
import { Post } from "@/components/board/post";
import { LegendList } from "@legendapp/list";
import { createScopedLog } from "@/utils/logger";
import { ImageSource } from "expo-image";

const log = createScopedLog("BoardList");

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
  const listRef = React.useRef<any>(null);

  const handleContentSizeChange = React.useCallback(() => {
    listRef.current?.scrollToIndex({ index: 0, animated: true });
    log.info("Scrolled to top, number of posts displayed:", {
      postCount: posts.length,
    });
  }, [posts.length]);

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
      ref={listRef}
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
      onContentSizeChange={handleContentSizeChange}
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
