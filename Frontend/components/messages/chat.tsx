import { useCallback, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo("en-US");

export type ChatItem = {
  id: string;
  title: string;
  subtitle: string;
  preview: string;
  timestamp: Date;
  group: boolean;
};

export function Chat({
  item,
  onPress,
}: {
  item: ChatItem;
  onPress: (id: string) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Pressable
      onPress={() => onPress(item.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.row, { transform: [{ scale }] }]}>
        <View style={styles.avatar}>
          <IconSymbol
            name={item.group ? "person.2.fill" : "person.fill"}
            color="white"
            size={item.group ? 24 : 18}
          />
        </View>

        <View style={styles.rowContent}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.timeContainer}>
              <Text style={styles.time}>
                {timeAgo.format(item.timestamp, "twitter-minute-now")}
              </Text>
              <IconSymbol
                name="chevron.right"
                color="rgba(255,255,255,0.5)"
                size={12}
              />
            </View>
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            {item.preview}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    flexShrink: 1,
  },
  preview: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    flexShrink: 1,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 8,
  },
  time: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
});
