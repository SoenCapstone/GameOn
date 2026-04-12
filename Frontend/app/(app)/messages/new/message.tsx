import { useMemo, useState } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { StyleSheet } from "react-native";
import { LegendList } from "@legendapp/list/react-native";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useMessagingContext } from "@/contexts/messaging";
import { useUserDirectory } from "@/hooks/messages/use-user-directory";
import { errorToString } from "@/utils/error";
import { toast } from "@/utils/toast";
import { Form } from "@/components/form/form";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";

function NewMessageToolbar({
  onSearchChange,
}: Readonly<{ onSearchChange: (text: string) => void }>) {
  return (
    <>
      <Stack.Screen.Title>New Message</Stack.Screen.Title>
      <Stack.SearchBar
        hideNavigationBar={false}
        onChangeText={(event) => {
          onSearchChange(event.nativeEvent.text || "");
        }}
        placement="automatic"
      />
    </>
  );
}

export default function NewMessage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const { userId } = useAuth();
  const { startDirectConversation } = useMessagingContext();
  const { data: users, isLoading: loadingUsers } = useUserDirectory();

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
      toast.error("Can't Message Yourself");
      return;
    }
    try {
      setCreating(true);
      const conversation = await startDirectConversation({ targetUserId });
      router.replace(`/messages/${conversation.id}`);
    } catch (err) {
      toast.error("Unable To Start Chat", {
        description: errorToString(err),
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <ContentArea
      background={{ preset: "green", mode: "form" }}
      toolbar={<NewMessageToolbar onSearchChange={setQuery} />}
    >
      {loadingUsers ? (
        <Loading />
      ) : filteredUsers.length === 0 ? (
        <Empty message={query.trim() ? "No users found" : "No users available"} />
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
