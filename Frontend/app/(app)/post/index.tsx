import { useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { toast } from "@/utils/toast";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { BoardPostScope } from "@/components/board/board-types";
import { AccentColors } from "@/constants/colors";
import { useCreateBoardPost } from "@/hooks/use-team-board";
import { useCreateLeagueBoardPost } from "@/hooks/use-league-board";
import { errorToString } from "@/utils/error";
import { FormToolbar } from "@/components/form/form-toolbar";

const PostScope: BoardPostScope[] = ["Members", "Everyone"];

export default function Post() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    privacy?: string;
    spaceType?: string;
  }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const isPrivate = params.privacy === "PRIVATE";
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<BoardPostScope | undefined>(
    isPrivate ? "Members" : undefined,
  );
  const [body, setBody] = useState("");

  const createTeamPostMutation = useCreateBoardPost(id);
  const createLeaguePostMutation = useCreateLeagueBoardPost(id);

  const createPostMutation =
    params.spaceType === "league"
      ? createLeaguePostMutation
      : createTeamPostMutation;

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !body.trim() || !scope) {
      toast.error("Failed To Post", {
        description: "Fill all required fields",
      });
      return;
    }

    try {
      await createPostMutation.mutateAsync({
        spaceId: id,
        title: title.trim(),
        scope,
        body: body.trim(),
      });
      router.back();
    } catch (err) {
      toast.error("Failed To Post", {
        description: errorToString(err),
      });
    }
  }, [body, createPostMutation, id, router, scope, title]);

  return (
    <ContentArea
      background={{ preset: "red", mode: "form" }}
      toolbar={
        <FormToolbar
          title="New Post"
          label="Post"
          onSubmit={handleSubmit}
          loading={createPostMutation.isPending}
        />
      }
    >
      <Form accentColor={AccentColors.blue}>
        <Form.Section
          footer={
            isPrivate
              ? "Private teams can only share posts with their members."
              : undefined
          }
        >
          <Form.Input
            label="Title"
            placeholder="Enter title"
            value={title}
            onChangeText={setTitle}
            editable={!createPostMutation.isPending}
            maxLength={200}
          />
          <Form.Menu
            label="Scope"
            placeholder="Select scope"
            options={PostScope}
            value={scope}
            onValueChange={(value) => setScope(value as BoardPostScope)}
            disabled={isPrivate}
          />
          <Form.TextArea
            placeholder="What's new?"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={body}
            onChangeText={setBody}
            editable={!createPostMutation.isPending}
            maxLength={1000}
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
