import React, { useState, useCallback, useLayoutEffect } from "react";
import { Text, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { TextAreaItem } from "@/components/form/text-area-item";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";
import { BoardPostScope } from "@/components/teams/board/team-board-types";
import { AccentColors } from "@/constants/colors";
import { useCreateBoardPost } from "@/hooks/use-team-board";
import { errorToString } from "@/utils/error";

const POST_SCOPES: BoardPostScope[] = ["players", "everyone"];

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
          label={isPosting ? "Posting..." : "Post"}
          onPress={onPost}
        />
      }
    />
  );
}

export default function CreatePostScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const router = useRouter();
  const navigation = useNavigation();

  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<BoardPostScope>("players");
  const [content, setContent] = useState("");

  const createPostMutation = useCreateBoardPost(id);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Failed to Post", "Please enter title");
      return;
    }

    if (!content.trim()) {
      Alert.alert("Failed to Post", "Please enter content");
      return;
    }

    try {
      await createPostMutation.mutateAsync({
        teamId: id,
        title: title.trim(),
        scope,
        content: content.trim(),
      });
      Alert.alert("Success", "Post created");
      router.back();
    } catch (err) {
      Alert.alert("Failed to post", errorToString(err));
    }
  }, [content, createPostMutation, id, router, scope, title]);

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
        <Form.Section>
          <Form.Input
            label="Title"
            placeholder="Enter title"
            value={title}
            onChangeText={setTitle}
            editable={!createPostMutation.isPending}
          />
          <TextAreaItem
            placeholder="Tell the team about something..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={content}
            onChangeText={setContent}
            editable={!createPostMutation.isPending}
            maxLength={1000}
          />
          <Text style={styles.counter}>{content.length}/1000</Text>
        </Form.Section>

        <Form.Section>
          <Form.Menu
            label="Scope"
            options={POST_SCOPES}
            value={scope}
            onValueChange={(value) => setScope(value as BoardPostScope)}
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
const styles = StyleSheet.create({
  counter: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 8,
  },
});
