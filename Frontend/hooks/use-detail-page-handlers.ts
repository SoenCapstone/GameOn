import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { errorToString } from "@/utils/error";
import { createScopedLog } from "@/utils/logger";

interface DetailPageHandlersConfig {
  id: string;
  currentTab: string;
  boardPosts: unknown[];
  onRefresh: () => Promise<void>;
  refetchPosts: () => Promise<unknown>;
  refetchOverview?: () => Promise<unknown>;
  refetchStandings?: () => Promise<unknown>;
  deletePostMutation: {
    mutateAsync: (postId: string) => Promise<void>;
  };
  entityName: string;
  onMatchesRefresh?: () => Promise<void>;
}

export function useDetailPageHandlers({
  id,
  currentTab,
  boardPosts,
  onRefresh,
  refetchPosts,
  refetchOverview,
  refetchStandings,
  deletePostMutation,
  entityName,
  onMatchesRefresh,
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
      } else if (currentTab === "overview" && refetchOverview) {
        await refetchOverview();
        log.info("Overview data refreshed");
      } else if (currentTab === "standings" && refetchStandings) {
        await refetchStandings();
        log.info("Standings refreshed");
      } else if (currentTab === "matches" && onMatchesRefresh) {
        await onMatchesRefresh();
        log.info("Matches refreshed");
      } else {
        log.info(`${entityName} data refreshed`, { tab: currentTab });
      }
    } catch (err) {
      log.error("Refresh failed", {
        error: errorToString(err),
        tab: currentTab,
      });
    } finally {
      setRefreshing(false);
    }
  }, [
    onRefresh,
    currentTab,
    refetchOverview,
    refetchStandings,
    onMatchesRefresh,
    refetchPosts,
    log,
    boardPosts.length,
    entityName,
  ]);

  return {
    refreshing,
    setRefreshing,
    handleDeletePost,
    handleRefresh,
  };
}
