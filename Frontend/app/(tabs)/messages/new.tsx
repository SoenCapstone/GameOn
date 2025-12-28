import React, { useMemo, useState } from "react";
import { ContentArea } from "@/components/ui/content-area";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type User = {
  id: string;
  name: string;
};

const MOCK_USERS: User[] = [
  { id: "dexter", name: "Dexter Yamaha" },
  { id: "sam", name: "Sam" },
  { id: "alex", name: "Alex" },
  { id: "remi", name: "Remi" },
  { id: "atlas", name: "Atlas Athletic" },
];

export default function NewChat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_USERS;
    return MOCK_USERS.filter((u) =>
      u.name.toLowerCase().includes(q)
    );
  }, [query]);

  const startChat = (user: User) => {
    // deterministic chatId for now (backend later)
    router.replace(`/messages/dm-${user.id}`);
  };

  return (
    <ContentArea backgroundProps={{ preset: "green" }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.circleBtn}>
            <Text style={styles.circleIcon}>‹</Text>
          </Pressable>

          <Text style={styles.title}>New Chat</Text>

          <View style={{ width: 44 }} />
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search users..."
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={styles.search}
          />
        </View>

        {/* Users list */}
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => startChat(item)} style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name[0]?.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.name}>{item.name}</Text>
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
  },

  header: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },

  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  circleIcon: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginTop: -2,
  },

  searchWrap: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },

  search: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },

  list: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },

  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
});
