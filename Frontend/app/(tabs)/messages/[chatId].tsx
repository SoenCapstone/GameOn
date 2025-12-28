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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Message = { id: string; text: string; fromMe: boolean };

const MOCK_THREADS: Record<
  string,
  { title: string; subtitle: string; messages: Message[] }
> = {
  "dm-dexter": {
    title: "Dexter Yamaha",
    subtitle: "Online",
    messages: [
      { id: "1", text: "Heyy are you coming tonight", fromMe: true },
      { id: "2", text: "Yoooo, yes, what time is the game at?", fromMe: false },
      { id: "3", text: "its at 7pm", fromMe: true },
      { id: "4", text: "aytt sounds good", fromMe: false },
      { id: "5", text: "do you need a ride", fromMe: true },
      { id: "6", text: "nah should be fine", fromMe: false },
      { id: "7", text: "sounds good see u", fromMe: true },
      { id: "8", text: "see u!", fromMe: false },
    ],
  },

  // ✅ GROUP CHAT
  "grp-fcbarca": {
    title: "FC Barcelona",
    subtitle: "6 members",
    messages: [
      {
        id: "1",
        text: "Hey team, I think we are missing a person for tonight",
        fromMe: false,
      },
      {
        id: "2",
        text: "Yeah Kyle can’t make it",
        fromMe: false,
      },
      {
        id: "3",
        text: "We need a replacement then",
        fromMe: true,
      },
      {
        id: "4",
        text: "Sam is replacing him",
        fromMe: false,
      },
    ],
  },
};

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();

  const thread = useMemo(() => {
    return MOCK_THREADS[chatId ?? ""] ?? {
      title: "Chat",
      subtitle: "",
      messages: [],
    };
  }, [chatId]);

  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>(thread.messages);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), text: trimmed, fromMe: true },
    ]);
    setText("");
  };

  return (
    <ContentArea backgroundProps={{ preset: "green" }}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.circleBtn}>
            <Text style={styles.circleIcon}>‹</Text>
          </Pressable>

          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {thread.title[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {thread.title}
            </Text>
            {!!thread.subtitle && (
              <Text style={styles.headerSub} numberOfLines={1}>
                {thread.subtitle}
              </Text>
            )}
          </View>

          <Pressable style={styles.circleBtn}>
            <Text style={styles.circleIcon}>⚙︎</Text>
          </Pressable>
        </View>

        <Text style={styles.today}>Today</Text>

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.fromMe ? styles.bubbleMe : styles.bubbleThem,
                item.fromMe ? styles.right : styles.left,
              ]}
            >
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
          )}
        />

        {/* Composer */}
        <View
          style={[
            styles.composer,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <Pressable style={styles.plusCircle}>
            <Text style={styles.plus}>+</Text>
          </Pressable>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
          />

          <Pressable style={styles.sendBtn} onPress={send}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </View>
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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

  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarLetter: { color: "white", fontWeight: "800", fontSize: 18 },

  headerText: { flex: 1 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  headerSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 2,
  },

  today: {
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    marginTop: 6,
    marginBottom: 10,
    fontWeight: "600",
  },

  list: { paddingHorizontal: 14, paddingBottom: 10 },

  bubble: {
    maxWidth: "80%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 10,
  },

  bubbleMe: { backgroundColor: "rgba(255,255,255,0.20)" },
  bubbleThem: { backgroundColor: "rgba(0,0,0,0.18)" },

  right: { alignSelf: "flex-end", borderTopRightRadius: 6 },
  left: { alignSelf: "flex-start", borderTopLeftRadius: 6 },

  bubbleText: { color: "white", fontSize: 16 },

  composer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.10)",
  },

  plusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  plus: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    marginTop: -2,
  },

  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    color: "white",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  sendBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  sendText: { color: "white", fontWeight: "800" },
});
