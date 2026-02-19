import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { errorToString } from "@/utils/error";
import { createScopedLog } from "@/utils/logger";

interface DetailPageHandlersConfig {
  id: string;
  currentTab: string;
  boardPosts: unknown[];
  onRefresh: () => Promise<void>;
  refetchPosts: () => Promise<unknown>; // React Query refetch returns QueryObserverResult
  deletePostMutation: {
    mutateAsync: (postId: string) => Promise<void>;
  };
  entityName: string; // "league" or "team" for logging
}

export function useDetailPageHandlers({
  id,
  currentTab,
  boardPosts,
  onRefresh,
  refetchPosts,
  deletePostMutation,
  entityName,
}: DetailPageHandlersConfig) {
  const [refreshing, setRefreshing] = useState(false);
  const log = createScopedLog(`${entityName} Detail Page`);

  const handleDeletePost = (postId: string) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      {
        text: "Cancel",
        onPress: () => log.info("Delete post cancelled", { postId }),
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deletePostMutation.mutateAsync(postId);
            log.info("Post deleted", { postId });
          } catch (err) {
            log.error("Failed to delete post", {
              postId,
              error: errorToString(err),
            });
            Alert.alert("Failed to delete", errorToString(err));
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await onRefresh();
      if (currentTab === "board") {
        await refetchPosts();
        log.info("Board posts refreshed", { postCount: boardPosts.length });
      } else {
        log.info(`${entityName} data refreshed`, { tab: currentTab });
      }
    } catch (err) {
      log.error("Refresh failed", { error: errorToString(err), tab: currentTab });
    } finally {
      setRefreshing(false);
    }
  }, [log, onRefresh, refetchPosts, currentTab, boardPosts.length, entityName]);

  return {
    refreshing,
    setRefreshing,
    handleDeletePost,
    handleRefresh,
  };
}
