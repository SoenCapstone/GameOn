import { useCallback, useState } from "react";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { useRouter } from "expo-router";
import { useMessagingContext } from "@/contexts/messaging";
import { useMyTeams } from "@/hooks/messages/use-my-teams";
import { errorToString } from "@/utils/error";
import { toast } from "@/utils/toast";
import { FormToolbar } from "@/components/form/form-toolbar";
import { Loading } from "@/components/ui/loading";

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
  const hasTeams = (teams ?? []).length > 0;

  const submitTeamChat = useCallback(async () => {
    const trimmed = chatName.trim();
    if (!selectedTeam || !trimmed) {
      toast.error("Unable To Create Chat", {
        description: "Fill all required fields",
      });
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
      toast.error("Unable To Create Chat", {
        description: errorToString(err),
      });
    } finally {
      setCreating(false);
    }
  }, [selectedTeam, chatName, isEvent, startTeamConversation, router]);

  return (
    <ContentArea
      background={{ preset: "green", mode: "form" }}
      toolbar={
        <FormToolbar
          title="New Group"
          disabled={!hasTeams}
          loading={creating}
          onSubmit={submitTeamChat}
        />
      }
    >
      {loadingTeams ? (
        <Loading />
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
