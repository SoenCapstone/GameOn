import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Card } from "@/components/ui/card";
import { BoardPost, BoardPostType, BoardPostScope } from "@/components/teams/team-board-types";

interface BoardPostCardProps {
  post: BoardPost;
  canPost: boolean;
  onDelete?: (postId: string) => void;
  isDeleting?: boolean;
}

const TYPE_COLORS: Record<BoardPostType, string> = {
  general: "#999999",
  game: "#FF6B35",
  training: "#4CAF50",
  other: "#9C27B0",
};

const SCOPE_LABELS: Record<BoardPostScope, string> = {
  players: "Team Members",
  everyone: "Everyone",
};

export function BoardPostCard({
  post,
  canPost,
  onDelete,
  isDeleting,
}: Readonly<BoardPostCardProps>) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <View style={styles.tagRow}>
              <View
                style={[
                  styles.typeTag,
                  { borderColor: TYPE_COLORS[post.type] },
                ]}
              >
                <Text
                  style={[
                    styles.typeTagText,
                    { color: TYPE_COLORS[post.type] },
                  ]}
                >
                  {post.type}
                </Text>
              </View>
              <Text style={styles.scope}>{SCOPE_LABELS[post.scope]}</Text>
            </View>
            <Text style={styles.authorName}>{post.authorName}</Text>
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        <Text style={styles.content} numberOfLines={4}>
          {post.content}
        </Text>

        {canPost && (
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
              isDeleting && styles.deleteButtonDisabled,
            ]}
            onPress={() => onDelete?.(post.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ff6b6b" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete</Text>
            )}
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerContent: {
    flex: 1,
    gap: 6,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  scope: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "500",
  },
  authorName: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "500",
  },
  date: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "500",
  },
  content: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 18,
  },
  deleteButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,59,48,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: "#ff3b30",
    fontSize: 12,
    fontWeight: "600",
  },
});