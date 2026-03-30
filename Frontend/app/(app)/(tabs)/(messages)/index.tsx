import {
  ComponentRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { ContentArea } from "@/components/ui/content-area";
import { LegendList } from "@legendapp/list/react-native";
import { router, Stack, useRouter } from "expo-router";
import { Logo } from "@/components/header/logo";
import { useConversationsQuery } from "@/hooks/messages/use-conversations-query";
import { useMyTeams } from "@/hooks/messages/use-my-teams";
import { useUserDirectory } from "@/hooks/messages/use-user-directory";
import { useAuth } from "@clerk/clerk-expo";
import { Chat, type ChatItem } from "@/components/messages/chat";
import * as Haptics from "expo-haptics";
import { Empty } from "@/components/ui/empty";
import { Loading } from "@/components/ui/loading";

function MessagesToolbar() {
  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.View hidesSharedBackground>
          <Logo />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <Stack.Screen.Title>Messages</Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="plus">
          <Stack.Toolbar.MenuAction
            icon="bubble.and.pencil"
            onPress={() => router.push("/messages/new/message")}
          >
            New Message
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            icon="person.2.badge.plus"
            onPress={() => router.push("/messages/new/group")}
          >
            New Group
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
    </>
  );
}

export default function Messages() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useConversationsQuery();
  const { data: users } = useUserDirectory();
  const { data: myTeams } = useMyTeams();
  const [filter, setFilter] = useState<"all" | "direct" | "group">("all");
  const listRef = useRef<ComponentRef<typeof LegendList>>(null);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((user) => {
      const full = `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();
      map.set(user.id, full || user.email);
    });
    return map;
  }, [users]);

  const userImageMap = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((user) => {
      if (user.imageUrl) {
        map.set(user.id, user.imageUrl);
      }
    });
    return map;
  }, [users]);

  const teamLogoMap = useMemo(() => {
    const map = new Map<string, string>();
    myTeams?.forEach((team) => {
      if (team.logoUrl) map.set(team.id, team.logoUrl);
    });
    return map;
  }, [myTeams]);

  const listData = useMemo<ChatItem[]>(() => {
    if (!data) return [];
    return data
      .filter((conversation) => {
        if (filter === "direct") return conversation.type === "DIRECT";
        if (filter === "group") return conversation.type === "GROUP";
        return true;
      })
      .map((conversation) => {
        const isGroup = conversation.type === "GROUP";
        const otherParticipant = conversation.participants.find(
          (p) => p.userId !== userId,
        );
        const title = isGroup
          ? (conversation.name ?? "Team chat")
          : (userMap.get(otherParticipant?.userId ?? "") ?? "Direct message");
        const preview =
          conversation.lastMessage?.content ?? "Start the conversation";
        const timestamp = new Date(
          conversation.lastMessage?.createdAt ??
            conversation.lastMessageAt ??
            conversation.createdAt,
        );
        let subtitle: string;
        if (!isGroup) {
          subtitle = "Direct message";
        } else if (conversation.isEvent) {
          subtitle = "Event chat";
        } else {
          subtitle = "Team chat";
        }
        const imageUrl =
          !isGroup && otherParticipant?.userId
            ? (userImageMap.get(otherParticipant.userId) ?? null)
            : isGroup && conversation.teamId
            ? (teamLogoMap.get(conversation.teamId) ?? null)
            : null;
        return {
          id: conversation.id,
          title,
          subtitle,
          preview,
          timestamp,
          group: isGroup,
          imageUrl: imageUrl ?? undefined,
        } satisfies ChatItem;
      });
  }, [data, filter, userId, userImageMap, userMap, teamLogoMap]);

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: 0, animated: true });
  }, [listData]);

  const handleRefresh = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
  }, [refetch]);

  const openConversation = (id: string) => router.push(`/messages/${id}`);

  const selectedIndex = { all: 0, direct: 1, group: 2 }[filter];

  return (
    <ContentArea
      tabs={{
        values: ["All", "Direct", "Groups"],
        selectedIndex,
        onValueChange: (value) => {
          if (value === "All") setFilter("all");
          else if (value === "Direct") setFilter("direct");
          else setFilter("group");
        },
      }}
      toolbar={<MessagesToolbar />}
      background={{ preset: "green" }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
      }
    >
      {isLoading ? (
        <Loading />
      ) : listData.length === 0 ? (
        <Empty message="No messages available" />
      ) : (
        <LegendList
          ref={listRef}
          data={listData}
          keyExtractor={(item) => item.id}
          style={{ overflow: "visible" }}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Chat item={item} onPress={openConversation} />
          )}
        />
      )}
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  listContent: {
    marginTop: 4,
    paddingHorizontal: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
});
