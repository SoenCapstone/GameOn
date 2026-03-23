import {
  chatListKeyExtractor,
  renderLegendChatItem,
} from "@/components/messages/chat-list-rows";
import { Background } from "@/components/ui/background";
import type { ChatListRow } from "@/constants/messaging";
import { useMessagingContext } from "@/contexts/messaging";
import { useConversationsQuery } from "@/hooks/messages/use-conversations-query";
import { useMessagesQuery } from "@/hooks/messages/use-messages-query";
import { useMyTeams } from "@/hooks/messages/use-my-teams";
import { useUserDirectory } from "@/hooks/messages/use-user-directory";
import { useHeaderHeight } from "@/hooks/use-header-height";
import { errorToString } from "@/utils/error";
import {
  buildChatListRows,
  buildMessagesFromPages,
  lastMessageId,
} from "@/utils/messaging/utils";
import { useAuth } from "@clerk/clerk-expo";
import { KeyboardAvoidingLegendList } from "@legendapp/list/keyboard";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

export function ChatToolbar({
  title,
  isGroup,
  imageUrl,
  teamId,
  text,
  setText,
  onSend,
  sending,
}: Readonly<{
  title: string;
  isGroup: boolean;
  imageUrl?: string | null;
  teamId?: string;
  text: string;
  setText: (value: string) => void;
  onSend: () => void;
  sending: boolean;
}>) {
  const router = useRouter();
  const icon = isGroup ? "shield.fill" : "person.fill";
  const handleTeamPress = () => teamId && router.push(`/teams/${teamId}`);
  const canSend = Boolean(text.trim()) && !sending;

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal">
        Messages
      </Stack.Screen.BackButton>
      <Stack.Screen.Title>{title}</Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        {imageUrl ? (
          <Stack.Toolbar.View>
            {isGroup && teamId ? (
              <Pressable onPress={handleTeamPress}>
                <Image
                  source={{ uri: imageUrl }}
                  style={[styles.avatar, styles.square]}
                  contentFit="cover"
                />
              </Pressable>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            )}
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Button icon={icon} onPress={handleTeamPress} />
        )}
      </Stack.Toolbar>
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.View>
          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message"
              placeholderTextColor="rgba(235,235,245,0.6)"
              style={styles.input}
              selectionColor="white"
              maxLength={2000}
            />
          </View>
        </Stack.Toolbar.View>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button
          icon="arrow.up"
          disabled={!canSend}
          onPress={onSend}
        />
      </Stack.Toolbar>
    </>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listRef = useRef<ComponentRef<typeof KeyboardAvoidingLegendList>>(null);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const bottomInset = insets.bottom + 44;
  const { userId } = useAuth();
  const { data: conversations } = useConversationsQuery();
  const { data: directory } = useUserDirectory();
  const { data: myTeams } = useMyTeams();
  const { sendMessage, ensureTopicSubscription } = useMessagingContext();
  const {
    data: messagePages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    error,
  } = useMessagesQuery(id);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const conversation = conversations?.find((c) => c.id === id);

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

  const getName = useCallback(
    (senderId: string) => userMap.get(senderId) ?? senderId,
    [userMap],
  );

  const rows = useMemo(
    () => buildChatListRows(messages, userId, getName),
    [messages, userId, getName],
  );

  const otherParticipant = conversation?.participants?.find(
    (p) => p.userId !== userId,
  );
  const directDisplayName = otherParticipant?.userId
    ? getName(otherParticipant.userId)
    : undefined;

  const headerTitle =
    conversation?.type === "GROUP"
      ? conversation?.name || "Team chat"
      : directDisplayName ||
        conversation?.name ||
        otherParticipant?.userId ||
        "Chat";

  const isGroup = conversation?.type === "GROUP";

  const imageUrl =
    isGroup && conversation?.teamId
      ? (myTeams?.find((t) => t.id === conversation.teamId)?.logoUrl ?? null)
      : (directory?.find((u) => u.id === otherParticipant?.userId)?.imageUrl ??
        null);

  const loading = !id || (isPending && messages.length === 0);

  const snap = useRef(false);
  const tail = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const id = lastMessageId(rows);

    if (id && tail.current !== id) {
      snap.current = true;
    }
    tail.current = id;
  }, [rows]);

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }, []),
  );

  const onSend = useCallback(async () => {
    if (!id || !text.trim()) return;
    try {
      setSending(true);
      await sendMessage(id, text);
      setText("");
    } catch (err) {
      Alert.alert("Unable to send", errorToString(err));
    } finally {
      setSending(false);
    }
  }, [id, text, sendMessage]);

  return (
    <>
      <ChatToolbar
        title={headerTitle}
        isGroup={isGroup}
        imageUrl={imageUrl}
        teamId={conversation?.teamId ?? undefined}
        text={text}
        setText={setText}
        onSend={onSend}
        sending={sending}
      />
      <Background preset="green" mode="form" />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="rgba(255,255,255,0.9)" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.lead}>Unable to load messages</Text>
          <Text style={styles.error}>{errorToString(error)}</Text>
        </View>
      ) : (
        <KeyboardAvoidingLegendList
          ref={listRef}
          key={id}
          data={rows}
          keyExtractor={chatListKeyExtractor}
          renderItem={renderLegendChatItem}
          onContentSizeChange={() => {
            if (snap.current) {
              listRef.current?.scrollToEnd({ animated: true });
              snap.current = false;
            }
          }}
          onStartReached={() => {
            if (!hasNextPage || isFetchingNextPage) return;
            void fetchNextPage();
          }}
          onStartReachedThreshold={1}
          maintainVisibleContentPosition
          getItemType={(item: ChatListRow) => item.type}
          getEstimatedItemSize={(_item, _index, type) =>
            type === "date" ? 40 : 56
          }
          estimatedItemSize={48}
          initialContainerPoolRatio={3}
          recycleItems
          contentContainerStyle={[
            styles.content,
            { paddingTop: headerHeight, paddingBottom: bottomInset },
          ]}
          safeAreaInsetBottom={16}
          keyboardDismissMode="interactive"
          alignItemsAtEnd
          initialScrollAtEnd
          style={styles.list}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  composer: {
    width: 310,
    minHeight: 36,
    justifyContent: "center",
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "white",
    fontSize: 16,
    maxHeight: 44,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 100,
  },
  square: {
    borderRadius: 0,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  lead: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  error: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    textAlign: "center",
  },
});
