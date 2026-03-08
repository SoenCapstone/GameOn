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
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { LegendList } from "@legendapp/list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import {
  useConversationsQuery,
  useMessagesQuery,
  useMyTeams,
  useUserDirectory,
} from "@/features/messaging/hooks";
import { useMessagingContext } from "@/features/messaging/provider";
import {
  buildMessagesFromPages,
  formatDateSeparator,
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
  createdAt: string;
};

type DateSeparatorItem = { type: "date"; id: string; label: string };
type MessageListItem = { type: "message"; message: DisplayMessage };
type ListItem = DateSeparatorItem | MessageListItem;

function LoadPreviousHeader({
  hasNextPage,
  onLoadPress,
  isLoading,
  style,
  textStyle,
}: Readonly<{
  hasNextPage: boolean;
  onLoadPress: () => void;
  isLoading: boolean;
  style: ViewStyle;
  textStyle: TextStyle;
}>) {
  if (!hasNextPage) return null;
  return (
    <Pressable style={style} onPress={onLoadPress}>
      {isLoading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={textStyle}>Load previous</Text>
      )}
    </Pressable>
  );
}

function ChatScreenHeader({
  title,
  subtitle,
  isGroup,
  imageUrl,
  teamId,
}: Readonly<{
  title: string;
  subtitle: string;
  isGroup: boolean;
  imageUrl?: string | null;
  teamId?: string | null;
}>) {
  const router = useRouter();
  const hasTeamImage = Boolean(teamId && imageUrl);
  const imageSource = teamId && imageUrl ? { uri: imageUrl } : undefined;
  const fallbackIcon = isGroup ? "shield.fill" : "person.fill";
  const iconName = hasTeamImage ? undefined : fallbackIcon;

  const right = (
    <Button
      type="custom"
      image={imageSource}
      icon={iconName}
      iconSize={isGroup ? 24 : 20}
      onPress={teamId ? () => router.push(`/teams/${teamId}`) : undefined}
      isInteractive={!!teamId}
    />
  );

  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title={title} subtitle={subtitle} />}
      right={right}
    />
  );
}

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
  const { data: myTeams } = useMyTeams();
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
      createdAt: msg.createdAt,
    }));
  }, [messages, userId, userMap]);

  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    let lastDayKey: string | null = null;
    for (const msg of displayMessages) {
      const date = new Date(msg.createdAt);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (dayKey !== lastDayKey) {
        lastDayKey = dayKey;
        items.push({
          type: "date",
          id: `date-${dayKey}`,
          label: formatDateSeparator(msg.createdAt),
        });
      }
      items.push({ type: "message", message: msg });
    }
    return items;
  }, [displayMessages]);

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

  const headerLogoUrl =
    isGroup && conversation?.teamId
      ? (myTeams?.find((t) => t.id === conversation.teamId)?.logoUrl ?? null)
      : null;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <ChatScreenHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          isGroup={isGroup}
          imageUrl={headerLogoUrl}
          teamId={conversation?.teamId ?? null}
        />
      ),
    });
  }, [
    navigation,
    headerTitle,
    headerSubtitle,
    isGroup,
    headerLogoUrl,
    conversation?.teamId,
  ]);

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
            data={listItems}
            keyExtractor={(item) =>
              item.type === "date" ? item.id : item.message.id
            }
            style={styles.list}
            scrollEnabled={false}
            ListHeaderComponent={
              <LoadPreviousHeader
                hasNextPage={hasNextPage}
                onLoadPress={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
                style={styles.loadMore}
                textStyle={styles.loadMoreText}
              />
            }
            renderItem={({ item }) =>
              item.type === "date" ? (
                <View style={styles.dateSeparator}>
                  <GlassView style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>{item.label}</Text>
                  </GlassView>
                </View>
              ) : (
                <View
                  style={[
                    styles.bubbleRow,
                    item.message.fromMe ? styles.right : styles.left,
                  ]}
                >
                  <GlassView
                    style={styles.bubble}
                    tintColor={item.message.fromMe ? "#1B5E2B" : "#2C2C2E"}
                  >
                    {!item.message.fromMe && (
                      <Text style={styles.senderLabel}>
                        {item.message.senderLabel}
                      </Text>
                    )}
                    <Text style={styles.bubbleText}>{item.message.text}</Text>
                    <Text style={styles.timestamp}>
                      {item.message.timestamp}
                    </Text>
                  </GlassView>
                </View>
              )
            }
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
  infoText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    marginTop: 6,
    marginBottom: 10,
    fontWeight: "600",
  },
  list: { flex: 1, overflow: "visible" },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 12,
  },
  dateBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  dateBadgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
  },
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
