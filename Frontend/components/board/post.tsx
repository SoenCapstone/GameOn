import { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageSourcePropType,
  Pressable,
  findNodeHandle,
} from "react-native";
import { Image } from "expo-image";
import { useActionSheet } from "@expo/react-native-action-sheet";
import ContextMenu from "react-native-context-menu-view";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BoardPost } from "@/components/board/board-types";
import { isRunningInExpoGo } from "@/utils/runtime";
import TimeAgo from "javascript-time-ago";

interface PostProps {
  post: BoardPost;
  spaceName: string;
  spaceLogo: ImageSourcePropType;
  onDelete?: (postId: string) => void;
  canDelete?: boolean;
}

export function Post({
  post,
  spaceName,
  spaceLogo,
  onDelete,
  canDelete = false,
}: Readonly<PostProps>) {
  const { showActionSheetWithOptions } = useActionSheet();
  const anchorRef = useRef<View>(null);
  const formattedTime = new TimeAgo("en-US").format(
    new Date(post.createdAt),
    "mini",
  );

  const handleDelete = () => {
    if (!onDelete) return;

    if (isRunningInExpoGo) {
      showActionSheetWithOptions(
        {
          options: ["Cancel", "Delete Post"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: "Delete this post?",
          anchor: findNodeHandle(anchorRef.current) ?? undefined,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            onDelete(post.id);
          }
        },
      );
    } else {
      onDelete(post.id);
    }
  };

  const cardContent = (
    <Card isInteractive={isRunningInExpoGo}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.space}>
              <Image
                source={spaceLogo}
                style={styles.logo}
                contentFit="contain"
              />
              <Text style={styles.name}>{spaceName}</Text>
            </View>
            <Text style={styles.title}>{post.title}</Text>
          </View>
          <Text style={styles.body}>{post.body}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.author}>{post.authorName}</Text>
          <View style={styles.info}>
            <Text style={styles.time}>{formattedTime}</Text>
            <Text style={styles.separator}>•</Text>
            <IconSymbol
              name={
                post.scope === "Everyone"
                  ? "globe.europe.africa.fill"
                  : "person.2.fill"
              }
              size={18}
              color="rgba(255,255,255,0.45)"
            />
          </View>
        </View>
      </View>
    </Card>
  );

  if (!canDelete || !onDelete) {
    return cardContent;
  }

  if (isRunningInExpoGo) {
    return (
      <Pressable ref={anchorRef} onLongPress={handleDelete}>
        {cardContent}
      </Pressable>
    );
  }

  return (
    <ContextMenu
      actions={[
        {
          title: "Delete",
          systemIcon: "trash",
          destructive: true,
        },
      ]}
      onPress={(e) => {
        if (e.nativeEvent.name === "Delete") {
          handleDelete();
        }
      }}
      previewBackgroundColor="transparent"
    >
      {cardContent}
    </ContextMenu>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  content: { gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingRight: 8,
  },
  space: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "500",
    flexShrink: 1,
  },
  title: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "500",
  },
  body: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  author: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "500",
  },
  separator: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    fontWeight: "500",
  },
});
