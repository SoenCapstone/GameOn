import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageSourcePropType,
  Pressable,
  findNodeHandle,
} from "react-native";
import { Image } from "expo-image";
import TimeAgo, { Unit, Suffix } from "react-timeago";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { Host, ContextMenu, Button } from "@expo/ui/swift-ui";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BoardPost } from "@/components/board/board-types";
import { isRunningInExpoGo } from "@/utils/runtime";

interface PostCardProps {
  post: BoardPost;
  sourceName: string;
  sourceLogo: ImageSourcePropType;
  posterRole?: string | null;
  onDelete?: (postId: string) => void;
  canDelete?: boolean;
}

function TimeAgoText(props: React.ComponentProps<typeof Text>) {
  return <Text style={styles.timeAgo} {...props} />;
}

const weekCappedFormatter = (
  value: number,
  unit: Unit,
  _suffix: Suffix,
  date: number,
): string => {
  const unitMap: Record<string, string> = {
    second: "s",
    minute: "m",
    hour: "h",
    day: "d",
    week: "w",
  };

  if (unit === "month" || unit === "year") {
    const diffInMs = Math.abs(Date.now() - date);
    const totalWeeks = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));
    return `${totalWeeks}w`;
  }

  return `${value}${unitMap[unit] || unit}`;
};

export function PostCard({
  post,
  sourceName,
  sourceLogo,
  onDelete,
  canDelete = false,
}: Readonly<PostCardProps>) {
  const { showActionSheetWithOptions } = useActionSheet();
  const anchorRef = React.useRef<View>(null);

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

  let logo: React.ReactNode;
  logo = (
    <Image
      source={sourceLogo}
      style={StyleSheet.absoluteFillObject}
      contentFit="contain"
    />
  );

  const cardContent = (
    <Card>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.logoImage}>{logo}</View>
            <Text style={styles.sourceName}>{sourceName}</Text>
          </View>
          <Text style={styles.messageFrom}>{post.title}</Text>
        </View>

        <Text style={styles.content}>{post.content}</Text>

        <View style={styles.footerRow}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <View style={styles.timeContainer}>
            <TimeAgo
              date={post.createdAt}
              minPeriod={60}
              component={TimeAgoText}
              formatter={weekCappedFormatter}
            />
            <Text style={styles.separator}>•</Text>
            <IconSymbol
              name={
                post.scope === "everyone"
                  ? "globe.europe.africa.fill"
                  : "person.3.fill"
              }
              size={20}
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
    <Host matchContents>
      <ContextMenu activationMethod="longPress">
        <ContextMenu.Items>
          <Button role="destructive" systemImage="trash" onPress={handleDelete}>
            Delete
          </Button>
        </ContextMenu.Items>
        <ContextMenu.Trigger>{cardContent}</ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  logoImage: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceName: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  messageFrom: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "500",
  },
  content: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  separator: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 20,
    fontWeight: "500",
  },
  authorName: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  timeAgo: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "500",
  },
});
