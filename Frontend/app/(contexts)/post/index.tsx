import { useState, useCallback, useLayoutEffect } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";
import { BoardPostScope } from "@/components/board/board-types";
import { AccentColors } from "@/constants/colors";
import { useCreateBoardPost } from "@/hooks/use-team-board";
import { errorToString } from "@/utils/error";

const PostScope: BoardPostScope[] = ["Members", "Everyone"];

function PostHeader({
  onPost,
  isPosting,
}: Readonly<{ onPost: () => void; isPosting: boolean }>) {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title="New Post" />}
      right={
        <Button
          type="custom"
          label="Post"
          loading={isPosting}
          onPress={onPost}
        />
      }
    />
  );
}

export default function Post() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    privacy?: string;
  }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const isPrivate = params.privacy === "PRIVATE";
  const router = useRouter();
  const navigation = useNavigation();

  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<BoardPostScope>("Members");
  const [body, setBody] = useState("");

  const createPostMutation = useCreateBoardPost(id);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Failed to Post", "Please enter title");
      return;
    }

    if (!body.trim()) {
      Alert.alert("Failed to Post", "Please enter body");
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
      Alert.alert("Failed to post", errorToString(err));
    }
  }, [body, createPostMutation, id, router, scope, title]);

  const headerTitle = useCallback(
    () => (
      <PostHeader
        onPost={handleSubmit}
        isPosting={createPostMutation.isPending}
      />
    ),
    [handleSubmit, createPostMutation.isPending],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle,
    });
  }, [navigation, headerTitle]);

  return (
    <ContentArea scrollable backgroundProps={{ preset: "red", mode: "form" }}>
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
