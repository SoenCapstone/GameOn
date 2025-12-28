import React, { useMemo, useState } from "react";
import { ContentArea } from "@/components/ui/content-area";
import {
  FlatList,
  Pressable,
  Text,
  View,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  isGroup: boolean;
  avatarUrl?: string;
};

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "dm-dexter",
    name: "Dexter",
    lastMessage: "Message preview",
    time: "11:40 AM",
    isGroup: false,
  },
  {
    id: "dm-sam",
    name: "Sam",
    lastMessage: "Message preview",
    time: "11:40 AM",
    isGroup: false,
  },
  {
    id: "dm-alex",
    name: "Alex",
    lastMessage: "Message preview",
    time: "11:40 AM",
    isGroup: false,
  },
  {
    id: "dm-remi",
    name: "Remi",
    lastMessage: "Message preview",
    time: "11:40 AM",
    isGroup: false,
  },
  {
    id: "grp-fcbarca",
    name: "FC Barcelona",
    lastMessage: "Message preview",
    time: "9:41 AM",
    isGroup: true,
  },
  {
    id: "grp-realmadrid",
    name: "Real Madrid",
    lastMessage: "Message preview",
    time: "9:41 AM",
    isGroup: true,
  },
];

type TabKey = "chats" | "groups";

export default function Messages() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>("chats");

  const data = useMemo(() => {
    return MOCK_CONVERSATIONS.filter((c) =>
      tab === "groups" ? c.isGroup : !c.isGroup
    );
  }, [tab]);

  const openConversation = (id: string) => {
    router.push(`/messages/${id}`);
  };

  const openNewChat = () => {
    router.push("/messages/new");
  };

  return (
    <ContentArea backgroundProps={{ preset: "green" }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.title}>Messages</Text>

          <Pressable onPress={openNewChat} style={styles.plusBtn}>
            <Text style={styles.plusText}>+</Text>
          </Pressable>
        </View>

        {/* Toggle */}
        <View style={styles.toggleWrap}>
          <Pressable
            onPress={() => setTab("chats")}
            style={[
              styles.toggleBtn,
              tab === "chats" ? styles.toggleActive : styles.toggleInactive,
            ]}
          >
            <Text style={styles.toggleText}>Chats</Text>
          </Pressable>

          <Pressable
            onPress={() => setTab("groups")}
            style={[
              styles.toggleBtn,
              tab === "groups" ? styles.toggleActive : styles.toggleInactive,
            ]}
          >
            <Text style={styles.toggleText}>Groups</Text>
          </Pressable>
        </View>

        {/* List */}
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openConversation(item.id)}
              style={styles.row}
            >
              <View style={styles.avatar}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.img} />
                ) : (
                  <Text style={styles.avatarText}>
                    {item.name?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                )}
              </View>

              <View style={styles.rowMid}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.preview}>{item.lastMessage}</Text>
              </View>

              <View style={styles.rowRight}>
                <Text style={styles.time}>{item.time}</Text>
                <Text style={styles.chev}>›</Text>
              </View>
            </Pressable>
          )}
        />
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

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
  },

  plusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  plusText: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "700",
    color: "white",
    marginTop: -2,
  },

  toggleWrap: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 4,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    gap: 6,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  toggleActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  toggleInactive: {
    backgroundColor: "transparent",
  },

  toggleText: {
    color: "white",
    fontWeight: "600",
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

  img: {
    width: 44,
    height: 44,
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
});
