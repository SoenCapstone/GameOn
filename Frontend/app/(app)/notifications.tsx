import { useCallback } from "react";
import { RefreshControl } from "react-native";
import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import { InviteCard } from "@/components/invite/card";
import { ContentArea } from "@/components/ui/content-area";
import { Empty } from "@/components/ui/empty";
import { Loading } from "@/components/ui/loading";
import { useNotifications } from "@/hooks/use-notifications";

function NotificationsToolbar() {
  return <Stack.Screen.Title>Notifications</Stack.Screen.Title>;
}

export default function Home() {
  const { notifications, isLoading, isRefreshing, refresh, respond } =
    useNotifications();

  const onRefresh = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refresh();
  }, [refresh]);

  return (
    <ContentArea
      toolbar={<NotificationsToolbar />}
      background={{ preset: "blue", mode: "form" }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {isLoading ? (
        <Loading />
      ) : notifications.length === 0 ? (
        <Empty message="No notifications available" />
      ) : (
        notifications.map((notification) => (
          <InviteCard
            key={notification.id}
            invite={notification}
            onRespond={(response) => respond(notification, response)}
          />
        ))
      )}
    </ContentArea>
  );
}
