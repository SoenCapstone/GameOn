import React, { useMemo, useState } from "react";
import { messagesNewStyles as styles } from "@/constants/messaging-styles";

import { ContentArea } from "@/components/ui/content-area";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useMessagingContext } from "@/features/messaging/provider";
import {
  useMyTeams,
  useUserDirectory,
} from "@/features/messaging/hooks";
import { errorToString } from "@/utils/error";

type TabKey = "direct" | "team";

export default function NewChat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>("direct");
  const [query, setQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [chatName, setChatName] = useState("");
  const [isEvent, setIsEvent] = useState(false);
  const [creating, setCreating] = useState(false);
  const { userId } = useAuth();
  const { startDirectConversation, startTeamConversation } = useMessagingContext();
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
      Alert.alert("Select a team" );
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
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.circleBtn}>
            <Text style={styles.circleIcon}>‹</Text>
          </Pressable>

          <Text style={styles.title}>New conversation</Text>

          <View style={{ width: 44 }} />
        </View>

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
                      {`${item.firstname ?? ""} ${item.lastname ?? ""}`.trim() || item.email}
                    </Text>
                    <Pressable onPress={() => startDirect(item.id)} disabled={creating}>
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
                Event chats lock membership once created. Only the creator can add members.
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
