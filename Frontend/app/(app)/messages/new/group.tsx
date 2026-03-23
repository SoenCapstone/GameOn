import { useCallback, useState } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { ActivityIndicator, Alert } from "react-native";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { Stack, useRouter } from "expo-router";
import { useMessagingContext } from "@/contexts/messaging";
import { useMyTeams } from "@/hooks/messages/use-my-teams";
import { errorToString } from "@/utils/error";

function NewGroupToolbar({
  creating,
  hasTeams,
  onPress,
}: Readonly<{
  creating: boolean;
  hasTeams: boolean;
  onPress: () => void;
}>) {
  return (
    <>
      <Stack.Screen.Title>New Group</Stack.Screen.Title>
      <Stack.Screen.BackButton displayMode="minimal">
        Messages
      </Stack.Screen.BackButton>
      <Stack.Toolbar placement="right">
        {creating ? (
          <Stack.Toolbar.View>
            <ActivityIndicator color="white" size="small" />
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Button disabled={!hasTeams} onPress={onPress}>
            Create
          </Stack.Toolbar.Button>
        )}
      </Stack.Toolbar>
    </>
  );
}

export default function NewGroup() {
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [chatName, setChatName] = useState("");
  const [isEvent, setIsEvent] = useState(false);
  const [creating, setCreating] = useState(false);
  const { startTeamConversation } = useMessagingContext();
  const { data: teams, isLoading: loadingTeams } = useMyTeams();
  const selectedTeamName =
    (teams ?? []).find((team) => team.id === selectedTeam)?.name ?? undefined;

  const submitTeamChat = useCallback(async () => {
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
  }, [selectedTeam, chatName, isEvent, startTeamConversation, router]);

  return (
    <ContentArea
      background={{ preset: "green", mode: "form" }}
      toolbar={
        <NewGroupToolbar
          creating={creating}
          hasTeams={(teams ?? []).length > 0}
          onPress={submitTeamChat}
        />
      }
    >
      {loadingTeams ? (
        <ActivityIndicator color="white" style={{ marginTop: 40 }} />
      ) : (
        <Form accentColor={AccentColors.green}>
          <Form.Section
            footer={`You can only create a group if you are the team owner.

Event chats lock membership once created. Only the creator can add members.`}
          >
            <Form.Input
              label="Name"
              value={chatName}
              onChangeText={setChatName}
              placeholder="Enter group name"
            />
            <Form.Menu
              label="Team"
              disabled={(teams ?? []).length === 0}
              options={(teams ?? []).map((team) => team.name)}
              value={selectedTeamName}
              placeholder={
                (teams ?? []).length > 0
                  ? "Select a team"
                  : "No teams available"
              }
              onValueChange={(name) => {
                const team = (teams ?? []).find((team) => team.name === name);
                setSelectedTeam(team?.id ?? null);
              }}
            />
            <Form.Switch
              label="Event Chat"
              value={isEvent}
              onValueChange={setIsEvent}
            />
          </Form.Section>
        </Form>
      )}
    </ContentArea>
  );
}
