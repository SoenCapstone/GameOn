import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from "react-native";
import { BoardPost } from "@/components/teams/board/team-board-types";
import { BoardPostCard } from "@/components/teams/board/board-post-card";
import { LegendList } from "@legendapp/list";
import { GlassView } from "expo-glass-effect";
import Icon from "react-native-vector-icons/Ionicons";

type SearchHeaderProps = {
  value: string;
  onChangeText?: (query: string) => void;
};

const SearchHeader = React.memo(function SearchHeader({
  value,
  onChangeText,
}: Readonly<SearchHeaderProps>) {
  return (
    <GlassView isInteractive style={styles.searchContainer}>
      <Icon name="search" size={20} color="#888" style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search"
        placeholderTextColor="rgba(255,255,255,0.5)"
        style={styles.searchInput}
      />
    </GlassView>
  );
});


interface TeamBoardListProps {
  posts: BoardPost[];
  isLoading: boolean;
  canPost: boolean;
  onEditPost?: (post: BoardPost) => void;
  onDeletePost: (postId: string) => void;
  isDeletingId?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function TeamBoardList({
  posts,
  isLoading,
  canPost,
  onEditPost,
  onDeletePost,
  isDeletingId,
  searchQuery = "",
  onSearchChange,
}: Readonly<TeamBoardListProps>) {
  const listRef = React.useRef<any>(null);

  const filteredPosts = React.useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const query = searchQuery.toLowerCase();
    return posts.filter((post) =>
      post.content.toLowerCase().includes(query) ||
      post.authorName.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  const handleSearchChange = React.useCallback(
    (value: string) => {
      onSearchChange?.(value);
    },
    [onSearchChange],
  );

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
    <LegendList
      ref={listRef}
      data={filteredPosts}
      keyExtractor={(item) => item?.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <SearchHeader value={searchQuery} onChangeText={handleSearchChange} />
      }
      renderItem={({ item }) => (
        <BoardPostCard
          post={item}
          canPost={canPost}
          onEdit={onEditPost}
          onDelete={onDeletePost}
          isDeleting={isDeletingId === item.id}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? "No matching announcements"
              : "No announcements yet"}
          </Text>
        </View>
      }
      recycleItems={true}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={handleContentSizeChange}
    />
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
    paddingBottom: 80,
    width: "100%",
    alignSelf: "center",
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 12,
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