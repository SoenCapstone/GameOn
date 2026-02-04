import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Card } from "@/components/ui/card";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native-popup-menu";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  BoardPost,
  BoardPostType,
  BoardPostScope,
} from "@/components/teams/board/team-board-types";

interface BoardPostCardProps {
  post: BoardPost;
  canPost: boolean;
  onDelete?: (postId: string) => void;
  onEdit?: (post: BoardPost) => void;
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
  onEdit,
  isDeleting,
}: Readonly<BoardPostCardProps>) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <Card isInteractive={false}>
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
          <View style={styles.rightHeader}>
            {canPost &&
              (isDeleting ? (
                <ActivityIndicator size="small" color="#ff6b6b" />
              ) : (
                <Menu>
                  <MenuTrigger>
                    <Icon
                      name="more-vert"
                      size={20}
                      color="rgba(255,255,255,0.6)"
                      style={{ padding: 8 }}
                    />
                  </MenuTrigger>
                  <MenuOptions
                    customStyles={{
                      optionsContainer: styles.menuContainer,
                    }}
                  >
                    <MenuOption onSelect={() => onEdit?.(post)}>
                      <View style={styles.menuItem}>
                        <Icon
                          name="edit"
                          size={18}
                          color="rgba(255,255,255,0.8)"
                        />
                        <Text style={styles.menuText}>Edit</Text>
                      </View>
                    </MenuOption>
                    <View style={styles.menuDivider} />
                    <MenuOption onSelect={() => onDelete?.(post.id)}>
                      <View style={styles.menuItem}>
                        <Icon name="delete" size={18} color="#ff3b30" />
                        <Text style={[styles.menuText, styles.menuTextDelete]}>
                          Delete
                        </Text>
                      </View>
                    </MenuOption>
                  </MenuOptions>
                </Menu>
              ))}
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>

        <Text style={styles.content} numberOfLines={4}>
          {post.content}
        </Text>
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
  rightHeader: {
    alignItems: "flex-end",
    gap: 8,
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
  menuContainer: {
    backgroundColor: "rgba(52, 42, 42, 0.8)",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    fontWeight: "500",
  },
  menuTextDelete: {
    color: "#ff3b30",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
  },
});
