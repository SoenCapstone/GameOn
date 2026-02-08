import { useMemo, useState } from "react";
import { ContentArea } from "@/components/ui/content-area";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useMessagingContext } from "@/features/messaging/provider";
import {
  useConversationsQuery,
  useUserDirectory,
} from "@/features/messaging/hooks";
import { formatMessageTimestamp } from "@/features/messaging/utils";

type ListRow = {
  id: string;
  title: string;
  subtitle: string;
  preview: string;
  timestamp: string;
  badge?: string;
  badgeTone?: string;
};

export default function Messages() {
  const router = useRouter();
  const { userId } = useAuth();
  const { socketState } = useMessagingContext();
  const { data, isLoading, refetch, isRefetching } = useConversationsQuery();
  const { data: users } = useUserDirectory();
  const [filter, setFilter] = useState<"all" | "direct" | "group">("all");

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((user) => {
      const full = `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();
      map.set(user.id, full || user.email);
    });
    return map;
  }, [users]);

  const listData = useMemo<ListRow[]>(() => {
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
        const badge = isGroup
          ? conversation.isEvent
            ? "Event"
            : "Team"
          : undefined;
        const timestamp = formatMessageTimestamp(
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
          badge,
        } satisfies ListRow;
      });
  }, [data, filter, userId, userMap]);

  const openConversation = (id: string) => router.push(`/messages/${id}`);

  return (
    <ContentArea backgroundProps={{ preset: "green" }}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: 0 }]}>
          <Pressable
            onPress={() => setFilter("all")}
            style={{ opacity: filter === "all" ? 1 : 0.6 }}
          >
            <Text style={styles.toggleText}>All</Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter("direct")}
            style={{ opacity: filter === "direct" ? 1 : 0.6 }}
          >
            <Text style={styles.toggleText}>Direct</Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter("group")}
            style={{ opacity: filter === "group" ? 1 : 0.6 }}
          >
            <Text style={styles.toggleText}>Groups</Text>
          </Pressable>
        </View>

        <Text style={styles.statusText}>
          Connection: {socketState === "connected" ? "Online" : socketState}
        </Text>

        {isLoading ? (
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
          <FlatList
            data={listData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="white"
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => openConversation(item.id)}
                style={styles.row}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.title?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>

                <View style={styles.rowMid}>
                  <Text style={styles.name}>{item.title}</Text>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.preview}
                  </Text>
                  {item.badge && (
                    <View style={styles.badgeRow}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.rowRight}>
                  <Text style={styles.time}>{item.timestamp}</Text>
                  <Text style={styles.chev}>›</Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginLeft: 18,
    marginBottom: 6,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  rowMid: {
    flex: 1,
  },
  name: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
  },
  preview: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
    marginLeft: 10,
  },
  time: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  chev: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 18,
    marginTop: -4,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
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
  toggleText: {
    color: "white",
    fontWeight: "700",
  },
});
