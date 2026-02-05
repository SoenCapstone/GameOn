import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { BoardPost } from "@/components/teams/board/team-board-types";
import { PostCard } from "@/components/posts/post-card";
import { LegendList } from "@legendapp/list";
import { Host } from "@expo/ui/swift-ui";

interface TeamBoardListProps {
  posts: BoardPost[];
  isLoading: boolean;
  sourceName: string;
  sourceLogo?: string | null;
  onDeletePost?: (postId: string) => void;
  canDelete?: boolean;
}

export function TeamBoardList({
  posts,
  isLoading,
  sourceName,
  sourceLogo,
  onDeletePost,
  canDelete = false,
}: Readonly<TeamBoardListProps>) {
  const listRef = React.useRef<any>(null);

  const handleContentSizeChange = React.useCallback(() => {
    listRef.current?.scrollToIndex({ index: 0, animated: true });
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Host matchContents>
      <LegendList
        ref={listRef}
        data={posts}
        keyExtractor={(item) => item?.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            sourceName={sourceName}
            sourceLogo={sourceLogo}
            onDelete={onDeletePost}
            canDelete={canDelete}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No announcements yet</Text>
          </View>
        }
        recycleItems={true}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={handleContentSizeChange}
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    minHeight: 200,
  },
  emptyContainer: {
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
    paddingBottom: 500,
    width: "100%",
    alignSelf: "center",
  },
});
