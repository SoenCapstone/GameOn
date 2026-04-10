import React, { ComponentRef, useEffect, useMemo, useRef } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { BoardPost } from "@/components/board/board-types";
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
  targetPostId?: string;
}

export function BoardList({
  posts,
  isLoading,
  spaceName,
  spaceLogo,
  onDeletePost,
  canDelete = false,
  targetPostId,
}: Readonly<BoardListProps>) {
  const { height: windowHeight } = useWindowDimensions();
  const listHeight = Math.max(320, Math.floor(windowHeight * 0.65));
  const listRef = useRef<ComponentRef<typeof LegendList>>(null);
  const lastScrolledPostIdRef = useRef<string | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIdleRef = useRef<number | null>(null);

  const targetIndex = useMemo(() => {
    if (!targetPostId) {
      return -1;
    }

    return posts.findIndex((post) => post.id === targetPostId);
  }, [posts, targetPostId]);

  const executeScroll = React.useCallback(() => {
    listRef.current?.scrollToIndex({ index: targetIndex, animated: true });
    lastScrolledPostIdRef.current = targetPostId ?? null;
  }, [targetIndex, targetPostId]);

  const scheduleWithTimer = React.useCallback(() => {
    pendingTimerRef.current = setTimeout(() => {
      requestAnimationFrame(executeScroll);
    }, 60);
  }, [executeScroll]);

  const handleIdle = React.useCallback(() => {
    pendingIdleRef.current = null;
    scheduleWithTimer();
  }, [scheduleWithTimer]);

  const scrollToTarget = React.useCallback(() => {
    if (!targetPostId || targetIndex < 0) {
      return;
    }

    if (lastScrolledPostIdRef.current === targetPostId) {
      return;
    }

    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }

    if (
      pendingIdleRef.current !== null &&
      typeof globalThis.cancelIdleCallback === "function"
    ) {
      globalThis.cancelIdleCallback(pendingIdleRef.current);
      pendingIdleRef.current = null;
    }

    if (typeof globalThis.requestIdleCallback === "function") {
      pendingIdleRef.current = globalThis.requestIdleCallback(handleIdle);
      return;
    }

    scheduleWithTimer();
  }, [handleIdle, scheduleWithTimer, targetIndex, targetPostId]);

  useEffect(() => {
    scrollToTarget();

    return () => {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
      }

      if (
        pendingIdleRef.current !== null &&
        typeof globalThis.cancelIdleCallback === "function"
      ) {
        globalThis.cancelIdleCallback(pendingIdleRef.current);
      }
    };
  }, [scrollToTarget]);

  const renderItem = React.useCallback(
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
      ref={listRef}
      data={posts}
      keyExtractor={(item) => item?.id}
      style={[styles.legendList, { minHeight: listHeight, height: listHeight }]}
      contentContainerStyle={styles.list}
      renderItem={renderItem}
      onContentSizeChange={scrollToTarget}
      ListEmptyComponent={<Empty message="No posts available" />}
      recycleItems={true}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  legendList: { overflow: "visible" },
  list: {
    gap: 12,
  },
});
