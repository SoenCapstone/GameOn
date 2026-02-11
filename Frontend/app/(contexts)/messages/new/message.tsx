import { useLayoutEffect, useMemo, useState } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { ActivityIndicator, Alert, StyleSheet } from "react-native";
import { LegendList } from "@legendapp/list";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { useNavigation, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useMessagingContext } from "@/features/messaging/provider";
import { useUserDirectory } from "@/features/messaging/hooks";
import { errorToString } from "@/utils/error";
import { Form } from "@/components/form/form";

function NewMessageHeader() {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title="New Message" />}
    />
  );
}

export default function NewMessage() {
  const router = useRouter();
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const { userId } = useAuth();
  const { startDirectConversation } = useMessagingContext();
  const { data: users, isLoading: loadingUsers } = useUserDirectory();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <NewMessageHeader />,
      headerSearchBarOptions: {
        hideNavigationBar: false,
        placement: "automatic",
        onChangeText: (event: { nativeEvent: { text: string } }) => {
          const text = event.nativeEvent.text || "";
          setQuery(text);
        },
      },
    });
  }, [navigation]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? [])
      .filter((u) => u.id !== userId)
      .filter((u) =>
        q
          ? `${u.firstname ?? ""} ${u.lastname ?? ""} ${u.email}`
              .toLowerCase()
              .includes(q)
          : true,
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

  return (
    <ContentArea scrollable backgroundProps={{ preset: "green", mode: "form" }}>
      {loadingUsers ? (
        <ActivityIndicator color="white" style={{ marginTop: 40 }} />
      ) : (
        <LegendList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          style={{ overflow: "visible" }}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const name =
              `${item.firstname ?? ""} ${item.lastname ?? ""}`.trim() ||
              item.email;
            return (
              <Form.Button
                label={name}
                button="Message"
                icon="message.fill"
                color="white"
                onPress={() => startDirect(item.id)}
                disabled={creating}
              />
            );
          }}
        />
      )}
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
});
