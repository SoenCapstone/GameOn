import { useLayoutEffect, useState } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { useNavigation, useRouter } from "expo-router";
import { useMessagingContext } from "@/features/messaging/provider";
import { useMyTeams } from "@/features/messaging/hooks";
import { errorToString } from "@/utils/error";

export default function NewGroup() {
  const router = useRouter();
  const navigation = useNavigation();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [chatName, setChatName] = useState("");
  const [isEvent, setIsEvent] = useState(false);
  const [creating, setCreating] = useState(false);
  const { startTeamConversation } = useMessagingContext();
  const { data: teams, isLoading: loadingTeams } = useMyTeams();

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
          left={<Button type="back" />}
          center={<PageTitle title="New Group" />}
          right={
            <View
              pointerEvents={
                creating || (teams ?? []).length === 0 ? "none" : "auto"
              }
            >
              <Button
                type="custom"
                label="Create"
                loading={creating}
                onPress={submitTeamChat}
              />
            </View>
          }
        />
      ),
    });
  }, [navigation, creating, teams, submitTeamChat]);

  return (
    <ContentArea scrollable backgroundProps={{ preset: "green", mode: "form" }}>
      {loadingTeams ? (
        <ActivityIndicator color="white" style={{ marginTop: 40 }} />
      ) : (
        <Form accentColor={AccentColors.green}>
          <Form.Section footer="Event chats lock membership once created. Only the creator can add members.">
            <Form.Input
              label="Name"
              value={chatName}
              onChangeText={setChatName}
              placeholder="Enter group name"
            />
            <Form.Menu
              label="Team"
              options={
                (teams ?? []).length > 0
                  ? [...(teams ?? []).map((t) => t.name)]
                  : ["No teams available"]
              }
              value={
                selectedTeam
                  ? ((teams ?? []).find((t) => t.id === selectedTeam)?.name ??
                    "Select a team")
                  : "Select a team"
              }
              onValueChange={(name) => {
                if (name === "Select a team" || name === "No teams available")
                  setSelectedTeam(null);
                else {
                  const t = (teams ?? []).find((t) => t.name === name);
                  setSelectedTeam(t?.id ?? null);
                }
              }}
            />
            <Form.Switch
              label="Event chat (locked)"
              value={isEvent}
              onValueChange={setIsEvent}
            />
          </Form.Section>
        </Form>
      )}
    </ContentArea>
  );
}
