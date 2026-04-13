import { useCallback, useState } from "react";
import { Pressable, RefreshControl, StyleSheet } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { RelativePathString, router, Stack, useFocusEffect } from "expo-router";
import { Logo } from "@/components/header/logo";
import { ContentArea } from "@/components/ui/content-area";
import { getNotificationsQueryKey } from "@/utils/notifications";
import { useNotificationsCount } from "@/hooks/use-notifications";
import { useQueryClient } from "@tanstack/react-query";
import { HomeList } from "@/components/feed/home-list";
import { useFollowingFeed } from "@/hooks/use-following-feed";
import { useHomeFeed } from "@/hooks/use-home-feed";
import type { HomeFeedPostItem } from "@/types/feed";
import { useRefereeMatches } from "@/hooks/use-referee-matches";
import { useReferee } from "@/contexts/referee-context";
import {
  MatchListSections,
  type MatchItem,
} from "@/components/matches/match-list-sections";

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
  const [tab, setTab] = useState<"feed" | "following" | "refereeing">("feed");
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { isReferee } = useReferee();
  const {
    data: feedItems = [],
    isLoading: feedLoading,
    isRefetching: feedRefetching,
    refetch: refetchFeed,
  } = useHomeFeed();
  const {
    today,
    upcoming,
    past,
    isLoading: refereeLoading,
    isRefetching: refereeRefetching,
    refetch: refetchReferee,
  } = useRefereeMatches();

  const {
    data: followingData,
    isLoading: followingLoading,
    isRefetching: followingRefetching,
    refetch: refetchFollowing,
  } = useFollowingFeed();

  const followingItems = followingData?.items ?? [];

  const tabs = isReferee
    ? ["Feed", "Following", "Refereeing"]
    : ["Feed", "Following"];

  const handleMatchPress = useCallback((item: MatchItem) => {
    router.push({
      pathname: `/match/${item.id}` as RelativePathString,
      params: {
        space: item.space,
        spaceId: item.spaceId,
        leagueId:
          item.space === "league"
            ? item.spaceId
            : "leagueId" in item.match!
              ? item.match.leagueId
              : "",
        homeName: item.homeName,
        awayName: item.awayName,
        homeLogoUrl: item.homeLogoUrl ?? undefined,
        awayLogoUrl: item.awayLogoUrl ?? undefined,
      },
    });
  }, []);

  const handlePostPress = useCallback((item: HomeFeedPostItem) => {
    const pathname =
      item.space.kind === "team"
        ? (`/teams/${item.space.id}` as RelativePathString)
        : (`/leagues/${item.space.id}` as RelativePathString);

    router.push({
      pathname,
      params: {
        tab: "board",
      },
    });
  }, []);

  const handleRefresh = useCallback(() => {
    void refetchFeed();
    void refetchFollowing();
    void refetchReferee();
  }, [refetchFeed, refetchFollowing, refetchReferee]);

  const isRefreshing = feedRefetching || followingRefetching || refereeRefetching;

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
        values: tabs,
        selectedIndex: tab === "feed" ? 0 : tab === "following" ? 1 : 2,
        onValueChange: (value) => {
          if (value === "Feed") setTab("feed");
          if (value === "Following") setTab("following");
          if (value === "Refereeing") setTab("refereeing");
        },
      }}
      toolbar={<HomeToolbar />}
      background={{ preset: "blue" }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {tab === "feed" ? (
        <HomeList
          items={feedItems}
          isLoading={feedLoading}
          onMatchPress={(item) =>
            handleMatchPress({
              ...item,
              space: item.space.kind,
              spaceId: item.space.id,
            })
          }
          onPostPress={handlePostPress}
        />
      ) : tab === "refereeing" ? (
        <MatchListSections
          today={today}
          upcoming={upcoming}
          past={past}
          isLoading={refereeLoading}
          onMatchPress={handleMatchPress}
        />
      ) : tab === "following" ? (
        <HomeList
          items={followingItems}
          isLoading={followingLoading}
          onMatchPress={(item) =>
            handleMatchPress({
              ...item,
              space: item.space.kind,
              spaceId: item.space.id,
            })
          }
          onPostPress={handlePostPress}
        />
      ) : null}
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
