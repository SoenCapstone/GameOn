import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, Alert, StyleSheet } from "react-native";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/form/form";
import {
  BoardPostType,
  BoardPostScope,
  BoardPost,
} from "@/components/teams/board/team-board-types";
import { AccentColors } from "@/constants/colors";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Background } from "@/components/ui/background";
import { useHeaderHeight } from "@react-navigation/elements";

interface BoardCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    type: BoardPostType,
    scope: BoardPostScope,
    content: string,
  ) => Promise<void>;
  isLoading?: boolean;
  editPost?: BoardPost | null;
}

const POST_TYPES: BoardPostType[] = ["general", "game", "training", "other"];
const POST_SCOPES: BoardPostScope[] = ["players", "everyone"];

export function BoardCreateModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
  editPost,
}: Readonly<BoardCreateModalProps>) {
  const [type, setType] = useState<BoardPostType>("general");
  const [scope, setScope] = useState<BoardPostScope>("players");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    if (editPost) {
      setType(editPost.type);
      setScope(editPost.scope);
      setContent(editPost.content);
    }
  }, [editPost]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("Failed to Post", "Please enter content");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(type, scope, content.trim());
      setType("general");
      setScope("players");
      setContent("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmitButtonLabel = () => {
    if (submitting || isLoading) {
      return editPost ? "Updating..." : "Posting...";
    }
    return editPost ? "Update" : "Post";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      backdropColor={"black"}
      onRequestClose={onClose}
    >
      <Background preset="red" />
      <KeyboardAwareScrollView
        bottomOffset={30}
        contentContainerStyle={{
          paddingTop: headerHeight / 2,
          gap: 14,
        }}
        style={[styles.content]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 44, height: 44 }}>
            <Button type="custom" icon="chevron.left" onPress={onClose} />
          </View>
          <Text style={styles.headerTitle}>
            {editPost ? "Edit Post" : "New Post"}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Main Content Input */}
        <View style={styles.section}>
          <Text style={styles.placeholder}>
            Tell the team about something...
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter text"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={content}
            onChangeText={setContent}
            multiline
            editable={!submitting && !isLoading}
            maxLength={1000}
          />
        </View>

        {/* Type and Scope Selectors */}
        <Form accentColor="#0052ff">
          <Form.Menu
            label="Type"
            options={POST_TYPES}
            value={type}
            onValueChange={(value) => setType(value as BoardPostType)}
          />
          <Form.Menu
            label="Scope"
            options={POST_SCOPES}
            value={scope}
            onValueChange={(value) => setScope(value as BoardPostScope)}
          />
        </Form>

        {/* Counter */}
        <Text style={styles.counter}>{content.length}/1000</Text>

        {/* Submit Button */}
        <Form.Button
          label={getSubmitButtonLabel()}
          onPress={handleSubmit}
          color={AccentColors.blue}
        />
      </KeyboardAwareScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  placeholder: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "500",
  },
  textArea: {
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 100,
    maxHeight: 150,
  },
  counter: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
