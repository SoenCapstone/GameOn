import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { LegendList } from "@legendapp/list/react-native";
import { MatchCard } from "@/components/matches/match-card";
import { Post } from "@/components/board/post";
import { Empty } from "@/components/ui/empty";
import { Loading } from "@/components/ui/loading";
import type {
  HomeFeedItem,
  HomeFeedMatchItem,
  HomeFeedPostItem,
} from "@/types/feed";
import { getSportLogo } from "@/utils/search";

interface HomeFeedListProps {
  readonly items: HomeFeedItem[];
  readonly isLoading: boolean;
  readonly errorText?: string | null;
  readonly onMatchPress?: (item: HomeFeedMatchItem) => void;
  readonly onPostPress?: (item: HomeFeedPostItem) => void;
}

export function HomeFeedList({
  items,
  isLoading,
  errorText,
  onMatchPress,
  onPostPress,
}: Readonly<HomeFeedListProps>) {
  const renderItem = useCallback(
    function renderFeedItem({ item }: Readonly<{ item: HomeFeedItem }>) {
      if (item.kind === "post") {
        return (
          <Post
            isInteractive
            post={item.post}
            spaceName={item.space.name}
            spaceLogo={
              item.space.logoUrl
                ? { uri: item.space.logoUrl }
                : getSportLogo(item.space.sport)
            }
            onPress={
              onPostPress
                ? () => {
                    onPostPress(item);
                  }
                : undefined
            }
          />
        );
      }

      return (
        <MatchCard
          homeName={item.homeName}
          awayName={item.awayName}
          homeLogoUrl={item.homeLogoUrl}
          awayLogoUrl={item.awayLogoUrl}
          sport={item.sport}
          contextLabel={item.contextLabel}
          status={item.status}
          startTime={item.startTime}
          isPast={item.isPast}
          homeScore={item.homeScore}
          awayScore={item.awayScore}
          onPress={
            onMatchPress
              ? () => {
                  onMatchPress(item);
                }
              : undefined
          }
        />
      );
    },
    [onMatchPress, onPostPress],
  );

  if (isLoading) {
    return <Loading />;
  }

  if (errorText) {
    return null;
  }

  if (items.length === 0) {
    return <Empty message="No updates available" />;
  }

  return (
    <LegendList
      data={items}
      keyExtractor={(item) =>
        item.kind === "match"
          ? `match:${item.id}`
          : `post:${item.space.kind}:${item.space.id}:${item.id}`
      }
      style={styles.legendList}
      contentContainerStyle={styles.list}
      renderItem={renderItem}
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
