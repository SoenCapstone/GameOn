import { useEffect, useMemo, useRef, useState } from "react";
import { ContentArea } from "@/components/ui/content-area";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { LegendList } from "@legendapp/list";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import {
  useConversationsQuery,
  useUserDirectory,
} from "@/features/messaging/hooks";
import { Chat, type ChatItem } from "@/components/messages/chat";

export default function Messages() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useConversationsQuery();
  const { data: users } = useUserDirectory();
  const [filter, setFilter] = useState<"all" | "direct" | "group">("all");
  const listRef = useRef<any>(null);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((user) => {
      const full = `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();
      map.set(user.id, full || user.email);
    });
    return map;
  }, [users]);

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
        return {
          id: conversation.id,
          title,
          subtitle: isGroup
            ? conversation.isEvent
              ? "Event chat"
              : "Team chat"
            : "Direct message",
          preview,
          timestamp,
          group: isGroup,
        } satisfies ChatItem;
      });
  }, [data, filter, userId, userMap]);

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: 0, animated: true });
  }, [listData.length]);

  const openConversation = (id: string) => router.push(`/messages/${id}`);

  return (
    <ContentArea
      scrollable
      segmentedControl
      backgroundProps={{ preset: "green" }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="white"
        />
      }
    >
      <SegmentedControl
        values={["All", "Direct", "Groups"]}
        selectedIndex={filter === "all" ? 0 : filter === "direct" ? 1 : 2}
        onValueChange={(value) => {
          if (value === "All") setFilter("all");
          else if (value === "Direct") setFilter("direct");
          else setFilter("group");
        }}
        style={styles.segmented}
      />

      {isLoading || isRefetching ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color="white" />
        </View>
      ) : listData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a direct message or create a team chat to begin.
          </Text>
        </View>
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
  segmented: {
    height: 40,
  },
  listContent: {
    marginTop: 8,
    paddingHorizontal: 14,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    height: 160,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
  },
});
