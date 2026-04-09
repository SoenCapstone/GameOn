import { useCallback, useState } from "react";
import { Pressable, RefreshControl, StyleSheet } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { RelativePathString, router, Stack, useFocusEffect } from "expo-router";
import { Logo } from "@/components/header/logo";
import { ContentArea } from "@/components/ui/content-area";
import { Empty } from "@/components/ui/empty";
import { getNotificationsQueryKey } from "@/utils/notifications";
import { useNotificationsCount } from "@/hooks/use-notifications";
import { useQueryClient } from "@tanstack/react-query";
import { HomeFeedList } from "@/components/feed/home-feed-list";
import { useHomeFeed } from "@/hooks/use-home-feed";
import { errorToString } from "@/utils/error";
import type { HomeFeedMatchItem } from "@/types/feed";

function HomeToolbar() {
  const { user } = useUser();
  const { count } = useNotificationsCount();

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.View hidesSharedBackground>
          <Logo />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <Stack.Screen.Title>Home</Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={() => router.push("/notifications")}>
          <Stack.Toolbar.Icon sf="bell.fill" />
          {count ? (
            <Stack.Toolbar.Badge style={styles.badge}>
              {String(count)}
            </Stack.Toolbar.Badge>
          ) : null}
        </Stack.Toolbar.Button>
        {user?.hasImage ? (
          <Stack.Toolbar.View>
            <Pressable onPress={() => router.push("/settings")}>
              <Image
                source={{ uri: user.imageUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            </Pressable>
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Button
            icon="gear"
            onPress={() => router.push("/settings")}
          />
        )}
      </Stack.Toolbar>
    </>
  );
}

export default function Home() {
  const [tab, setTab] = useState<"feed" | "following">("feed");
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const {
    data: feedItems = [],
    error: feedError,
    isLoading: feedLoading,
    isRefetching: feedRefetching,
    refetch: refetchFeed,
  } = useHomeFeed();

  const handleMatchPress = useCallback((item: HomeFeedMatchItem) => {
    router.push({
      pathname: `/match/${item.id}` as RelativePathString,
      params: {
        space: item.space.kind,
        spaceId: item.space.id,
        homeName: item.homeName,
        awayName: item.awayName,
        homeLogoUrl: item.homeLogoUrl ?? undefined,
        awayLogoUrl: item.awayLogoUrl ?? undefined,
      },
    });
  }, []);

  const handleRefresh = useCallback(() => {
    if (tab === "feed") {
      void refetchFeed();
    }
  }, [refetchFeed, tab]);

  useFocusEffect(
    useCallback(() => {
      void queryClient.refetchQueries({
        queryKey: getNotificationsQueryKey(userId),
        exact: true,
      });
    }, [queryClient, userId]),
  );

  return (
    <ContentArea
      tabs={{
        values: ["Feed", "Following"],
        selectedIndex: tab === "feed" ? 0 : 1,
        onValueChange: (value) => {
          if (value === "Feed") setTab("feed");
          if (value === "Following") setTab("following");
        },
      }}
      toolbar={<HomeToolbar />}
      background={{ preset: "blue" }}
      refreshControl={
        <RefreshControl refreshing={feedRefetching} onRefresh={handleRefresh} />
      }
    >
      {tab === "feed" ? (
        <HomeFeedList
          items={feedItems}
          isLoading={feedLoading}
          errorText={feedError ? errorToString(feedError) : null}
          onMatchPress={handleMatchPress}
        />
      ) : (
        <Empty message="Following feed coming soon" />
      )}
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 100,
  },
  badge: {
    backgroundColor: "red",
  },
});
