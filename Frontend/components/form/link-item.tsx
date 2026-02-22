import {
  Text,
  StyleSheet,
  Pressable,
  PressableProps,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface LinkItemProps extends PressableProps {
  readonly label: string;
  readonly preview?: readonly string[];
}

const joinPreview = (items: readonly string[]) => items.join(", ");

export function LinkItem({
  label,
  preview,
  ...pressableProps
}: Readonly<LinkItemProps>) {
  const hasPreview = preview != null && preview.length > 0;
  const previewText = joinPreview(preview ?? []);

  return (
    <BlurView tint="systemUltraThinMaterialDark" style={styles.item}>
      <Pressable {...pressableProps} style={styles.pressable}>
        {({ pressed }) => (
          <>
            <Text
              style={[styles.label, !hasPreview && pressed && styles.pressed]}
            >
              {label}
            </Text>
            <View
              style={hasPreview ? [styles.right, pressed && styles.pressed] : styles.right}
            >
              {hasPreview && (
                <Text
                  style={styles.preview}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {previewText}
                </Text>
              )}
              <IconSymbol
                name="chevron.right"
                color="#8C8C8C"
                size={16}
                style={!hasPreview && pressed && styles.pressed}
              />
            </View>
          </>
        )}
      </Pressable>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  item: {
    width: "100%",
    height: 52,
    borderRadius: 100,
    overflow: "hidden",
    paddingLeft: 20,
    paddingRight: 20,
  },
  pressable: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "white",
    fontSize: 17,
    lineHeight: 22,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    maxWidth: "50%",
  },
  preview: {
    flex: 1,
    minWidth: 0,
    color: "#A9A9A9",
    fontSize: 17,
    lineHeight: 22,
    textAlign: "right",
  },
  pressed: {
    opacity: 0.7,
  },
});
