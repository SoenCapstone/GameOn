import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { BoardPost } from "@/types/board";
import { Post } from "@/components/board/post";
import { LegendList } from "@legendapp/list/react-native";
import { ImageSource } from "expo-image";
import { Empty } from "@/components/ui/empty";
import { Loading } from "@/components/ui/loading";

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
  const renderItem = useCallback(
    ({ item }: Readonly<{ item: BoardPost }>) => {
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
    return <Loading />;
  }

  return (
    <LegendList
      data={posts}
      keyExtractor={(item) => item?.id}
      style={styles.legendList}
      contentContainerStyle={styles.list}
      renderItem={renderItem}
      ListEmptyComponent={<Empty message="No posts available" />}
      recycleItems={true}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  legendList: { overflow: "visible" },
  list: {
    gap: 14,
  },
});