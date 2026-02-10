import { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";
import { ContentArea } from "@/components/ui/content-area";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { LegendList } from "@legendapp/list";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import {
  useConversationsQuery,
  useMessagesQuery,
  useUserDirectory,
} from "@/features/messaging/hooks";
import { useMessagingContext } from "@/features/messaging/provider";
import {
  buildMessagesFromPages,
  formatMessageTimestamp,
} from "@/features/messaging/utils";
import { errorToString } from "@/utils/error";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GlassView } from "expo-glass-effect";

type DisplayMessage = {
  id: string;
  text: string;
  fromMe: boolean;
  senderLabel?: string;
  timestamp: string;
};

export default function ChatScreen() {
  const contentRef = useRef<ScrollView | null>(null);
  const hasInitialScroll = useRef(false);
  const insets = useSafeAreaInsets();
  const composerBottomInset = Math.max(insets.bottom, 8);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const { data: conversations } = useConversationsQuery();
  const conversation = conversations?.find((c) => c.id === id);
  const { data: directory } = useUserDirectory();
  const { sendMessage, ensureTopicSubscription } = useMessagingContext();
  const {
    data: messagePages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useMessagesQuery(id ?? "");

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    directory?.forEach((entry) => {
      const full = `${entry.firstname ?? ""} ${entry.lastname ?? ""}`.trim();
      map.set(entry.id, full || entry.email);
    });
    return map;
  }, [directory]);

  useEffect(() => {
    if (conversation?.type === "GROUP" && conversation.id) {
      ensureTopicSubscription(conversation.id);
    }
  }, [conversation, ensureTopicSubscription]);

  const messages = useMemo(
    () => buildMessagesFromPages(messagePages),
    [messagePages],
  );

  const displayMessages = useMemo<DisplayMessage[]>(() => {
    return messages.map((msg) => ({
      id: msg.id,
      text: msg.content,
      fromMe: msg.senderId === userId,
      senderLabel:
        msg.senderId === userId
          ? "You"
          : (userMap.get(msg.senderId) ?? msg.senderId),
      timestamp: formatMessageTimestamp(msg.createdAt),
    }));
  }, [messages, userId, userMap]);

  useEffect(() => {
    if (hasInitialScroll.current) return;
    if (status !== "success" || displayMessages.length === 0) return;
    requestAnimationFrame(() => {
      contentRef.current?.scrollToEnd?.({ animated: false });
    });
    hasInitialScroll.current = true;
  }, [status, displayMessages.length]);

  const handleSend = async () => {
    if (!id) return;
    if (!text.trim()) return;
    try {
      setSending(true);
      await sendMessage(id, text);
      setText("");
    } catch (err) {
      Alert.alert("Unable to send", errorToString(err));
    } finally {
      setSending(false);
    }
  };

  const resolveParticipantName = (participantId?: string | null) => {
    if (!participantId) return undefined;
    return userMap.get(participantId) || participantId;
  };

  const otherParticipant = conversation?.participants?.find(
    (p) => p.userId !== userId,
  );
  const directDisplayName = resolveParticipantName(otherParticipant?.userId);

  const headerTitle =
    conversation?.type === "GROUP"
      ? conversation?.name || "Team chat"
      : directDisplayName ||
        conversation?.name ||
        otherParticipant?.userId ||
        "Chat";
  const headerSubtitle =
    conversation?.type === "GROUP"
      ? conversation.isEvent
        ? "Event chat"
        : "Team chat"
      : "Direct message";

  const showError = status === "error";

  const isGroup = conversation?.type === "GROUP";
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
          left={<Button type="back" />}
          center={<PageTitle title={headerTitle} subtitle={headerSubtitle} />}
          right={
            <GlassView style={styles.avatarCircle}>
              <IconSymbol
                name={isGroup ? "person.2.fill" : "person.fill"}
                color="white"
                size={isGroup ? 24 : 18}
              />
            </GlassView>
          }
        />
      ),
    });
  }, [navigation, headerTitle, headerSubtitle, isGroup]);

  return (
    <View style={styles.screen}>
      <ContentArea
        scrollable
        progressiveBlur
        scrollRef={contentRef as React.RefObject<ScrollView>}
        onContentSizeChange={() => {
          if (status !== "success") return;
          requestAnimationFrame(() => {
            contentRef.current?.scrollToEnd?.({ animated: true });
          });
        }}
        paddingBottom={composerBottomInset}
        backgroundProps={{ preset: "green", mode: "form" }}
      >
        {conversation?.isEvent && (
          <Text style={styles.infoText}>
            Event chats are locked; only original members can participate.
          </Text>
        )}

        {showError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Unable to load messages</Text>
            <Text style={styles.emptySubtitle}>{errorToString(error)}</Text>
          </View>
        ) : status === "pending" ? (
          <ActivityIndicator color="white" style={{ marginTop: 40 }} />
        ) : (
          <LegendList
            data={displayMessages}
            keyExtractor={(m) => m.id}
            style={styles.list}
            scrollEnabled={false}
            ListHeaderComponent={() =>
              hasNextPage ? (
                <Pressable
                  style={styles.loadMore}
                  onPress={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.loadMoreText}>Load previous</Text>
                  )}
                </Pressable>
              ) : null
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubbleRow,
                  item.fromMe ? styles.right : styles.left,
                ]}
              >
                <GlassView
                  style={styles.bubble}
                  tintColor={item.fromMe ? "#1B5E2B" : "#2C2C2E"}
                >
                  {!item.fromMe && (
                    <Text style={styles.senderLabel}>{item.senderLabel}</Text>
                  )}
                  <Text style={styles.bubbleText}>{item.text}</Text>
                  <Text style={styles.timestamp}>{item.timestamp}</Text>
                </GlassView>
              </View>
            )}
          />
        )}
      </ContentArea>

      <KeyboardStickyView
        offset={{ closed: -composerBottomInset, opened: -15 }}
      >
        <View style={styles.composerContainer}>
          <View style={styles.composer}>
            <GlassView isInteractive={true} style={styles.inputWrap}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Message"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.input}
                editable={!sending}
                selectionColor="white"
              />
            </GlassView>

            <Pressable
              onPress={handleSend}
              disabled={sending}
              accessibilityLabel="Send message"
            >
              <GlassView
                glassEffectStyle="regular"
                isInteractive={true}
                style={styles.sendBtn}
              >
                <IconSymbol
                  name="arrow.up"
                  size={22}
                  color="white"
                  style={styles.sendIcon}
                />
              </GlassView>
            </Pressable>
          </View>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    marginTop: 6,
    marginBottom: 10,
    fontWeight: "600",
  },
  list: { flex: 1, overflow: "visible" },
  bubbleRow: {
    maxWidth: "80%",
    marginBottom: 10,
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  right: { alignSelf: "flex-end" },
  left: { alignSelf: "flex-start" },
  senderLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginBottom: 2,
    fontWeight: "500",
  },
  bubbleText: { color: "white", fontSize: 16 },
  timestamp: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  composerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    height: 48,
    borderRadius: 100,
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: "white",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 100,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    alignSelf: "center",
  },
  loadMore: {
    paddingVertical: 12,
    alignItems: "center",
  },
  loadMoreText: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  emptyState: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
});
