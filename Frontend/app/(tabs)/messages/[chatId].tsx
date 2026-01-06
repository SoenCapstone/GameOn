import React, { useMemo, useState } from "react";
import { messagesChatStyles as styles } from "./styles";

import { ContentArea } from "@/components/ui/content-area";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  useConversationsQuery,
  useMessagesQuery,
  useUserDirectory,
} from "@/features/messaging/hooks";
import { useMessagingContext } from "@/features/messaging/provider";
import { buildMessagesFromPages, formatMessageTimestamp } from "@/features/messaging/utils";
import { errorToString } from "@/utils/error";



type DisplayMessage = {
  id: string;
  text: string;
  fromMe: boolean;
  senderLabel?: string;
  timestamp: string;
};

const TAB_BAR_FALLBACK_HEIGHT = 0;

const useOptionalTabBarHeight = () => {
  try {
    return useBottomTabBarHeight();
  } catch {
    return TAB_BAR_FALLBACK_HEIGHT;
  }
};

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useOptionalTabBarHeight();
  const composerBottomInset = Math.max(insets.bottom, 8);
  const composerPaddingBottom = composerBottomInset + tabBarHeight + 8;
  const keyboardOffset = tabBarHeight + 20;
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { userId } = useAuth();
  const { data: conversations } = useConversationsQuery();
  const conversation = conversations?.find((c) => c.id === chatId);
  const { data: directory } = useUserDirectory();
  const { sendMessage, ensureTopicSubscription } = useMessagingContext();
  const {
    data: messagePages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useMessagesQuery(chatId ?? "");

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

  React.useEffect(() => {
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
          : userMap.get(msg.senderId) ?? msg.senderId,
      timestamp: formatMessageTimestamp(msg.createdAt),
    }));
  }, [messages, userId, userMap]);

  const handleSend = async () => {
    if (!chatId) return;
    if (!text.trim()) return;
    try {
      setSending(true);
      await sendMessage(chatId, text);
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

  const otherParticipant = conversation?.participants?.find((p) => p.userId !== userId);
  const directDisplayName = resolveParticipantName(otherParticipant?.userId);

  const headerTitle =
    conversation?.type === "GROUP"
      ? conversation?.name || "Team chat"
      : directDisplayName || conversation?.name || otherParticipant?.userId || "Chat";
  const headerSubtitle = conversation?.type === "GROUP"
    ? conversation.isEvent
      ? "Event chat"
      : "Team chat"
    : "Direct message";

  const showError = status === "error";

  return (
    <ContentArea backgroundProps={{ preset: "green" }}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={keyboardOffset}
      >
        <View style={styles.screen}>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => router.back()} style={styles.circleBtn} accessibilityLabel="Back">
              <Text style={styles.circleIcon}>‹</Text>
            </Pressable>

          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {headerTitle[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {headerTitle}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {headerSubtitle}
            </Text>
            {conversation?.isEvent && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Membership locked</Text>
              </View>
            )}
          </View>

          <View style={{ width: 44 }} />
        </View>

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
        ) : status === "loading" ? (
          <ActivityIndicator color="white" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={displayMessages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={() => (
              hasNextPage ? (
                <Pressable style={styles.loadMore} onPress={() => fetchNextPage()}>
                  {isFetchingNextPage ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.loadMoreText}>Load previous</Text>
                  )}
                </Pressable>
              ) : null
            )}
            renderItem={({ item }) => (
              <View>
                <View
                  style={[
                    styles.bubble,
                    item.fromMe ? styles.bubbleMe : styles.bubbleThem,
                    item.fromMe ? styles.right : styles.left,
                  ]}
                >
                  {!item.fromMe && (
                    <Text style={styles.senderLabel}>{item.senderLabel}</Text>
                  )}
                  <Text style={styles.bubbleText}>{item.text}</Text>
                  <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
              </View>
            )}
          />
        )}

          <View
            style={[
              styles.composerContainer,
              {
                paddingBottom: composerPaddingBottom,
              },
            ]}
          >
            <View style={styles.composer}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Message"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.input}
                editable={!sending}
              />

              <Pressable
                style={styles.sendBtn}
                onPress={handleSend}
                disabled={sending}
                accessibilityLabel="Send message"
              >
                <Text style={styles.sendText}>{sending ? "..." : "Send"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ContentArea>
  );
}
