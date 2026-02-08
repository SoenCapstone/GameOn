import { useMemo, useState } from "react";

import { ContentArea } from "@/components/ui/content-area";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useMessagingContext } from "@/features/messaging/provider";
import { useMyTeams, useUserDirectory } from "@/features/messaging/hooks";
import { errorToString } from "@/utils/error";

type TabKey = "direct" | "team";

export default function NewChat() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("direct");
  const [query, setQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [chatName, setChatName] = useState("");
  const [isEvent, setIsEvent] = useState(false);
  const [creating, setCreating] = useState(false);
  const { userId } = useAuth();
  const { startDirectConversation, startTeamConversation } =
    useMessagingContext();
  const { data: users, isLoading: loadingUsers } = useUserDirectory();
  const { data: teams, isLoading: loadingTeams } = useMyTeams();

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? [])
      .filter((u) => u.id !== userId)
      .filter((u) =>
        !q
          ? true
          : `${u.firstname ?? ""} ${u.lastname ?? ""} ${u.email}`
              .toLowerCase()
              .includes(q),
      );
  }, [query, users, userId]);

  const startDirect = async (targetUserId: string) => {
    if (targetUserId === userId) {
      Alert.alert("Can't message yourself");
      return;
    }
    try {
      setCreating(true);
      const conversation = await startDirectConversation({ targetUserId });
      router.replace(`/messages/${conversation.id}`);
    } catch (err) {
      Alert.alert("Unable to start chat", errorToString(err));
    } finally {
      setCreating(false);
    }
  };

  const submitTeamChat = async () => {
    if (!selectedTeam) {
      Alert.alert("Select a team");
      return;
    }
    const trimmed = chatName.trim();
    if (!trimmed) {
      Alert.alert("Chat name required");
      return;
    }
    try {
      setCreating(true);
      const conversation = await startTeamConversation(selectedTeam, {
        name: trimmed,
        isEvent,
      });
      router.replace(`/messages/${conversation.id}`);
    } catch (err) {
      Alert.alert("Unable to create chat", errorToString(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <ContentArea backgroundProps={{ preset: "green" }}>
      <View style={styles.container}>
        <View style={styles.tabs}>
          {(["direct", "team"] as TabKey[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[styles.tabBtn, tab === key && styles.tabActive]}
            >
              <Text style={styles.tabText}>
                {key === "direct" ? "Direct" : "Team"}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "direct" ? (
          <>
            <View style={styles.searchWrap}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search users..."
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={styles.search}
              />
            </View>
            {loadingUsers ? (
              <ActivityIndicator color="white" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <View style={styles.row}>
                    <Text style={styles.name}>
                      {`${item.firstname ?? ""} ${item.lastname ?? ""}`.trim() ||
                        item.email}
                    </Text>
                    <Pressable
                      onPress={() => startDirect(item.id)}
                      disabled={creating}
                    >
                      <Text style={styles.actionLink}>Message</Text>
                    </Pressable>
                  </View>
                )}
              />
            )}
          </>
        ) : (
          <>
            {loadingTeams ? (
              <ActivityIndicator color="white" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={teams ?? []}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 200 }}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.row}
                    onPress={() => setSelectedTeam(item.id)}
                  >
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.actionLink}>
                      {selectedTeam === item.id ? "Selected" : "Select"}
                    </Text>
                  </Pressable>
                )}
                ListEmptyComponent={() => (
                  <View style={{ padding: 18 }}>
                    <Text style={styles.infoText}>
                      Join or create a team to start a group chat.
                    </Text>
                  </View>
                )}
              />
            )}

            <View style={styles.form}>
              <View>
                <Text style={styles.label}>Chat name</Text>
                <TextInput
                  style={styles.search}
                  value={chatName}
                  onChangeText={setChatName}
                  placeholder="Locker room"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Event chat (locked)</Text>
                <Switch value={isEvent} onValueChange={setIsEvent} />
              </View>

              <Text style={styles.infoText}>
                Event chats lock membership once created. Only the creator can
                add members.
              </Text>

              <Pressable
                style={styles.primaryBtn}
                onPress={submitTeamChat}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryText}>Create chat</Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 18,
    marginBottom: 12,
    gap: 12,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  tabActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  tabText: {
    color: "white",
    fontWeight: "700",
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
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  actionLink: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  form: {
    paddingHorizontal: 18,
    gap: 12,
    marginTop: 12,
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  infoText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
});
