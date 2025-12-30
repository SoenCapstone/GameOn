import { Text, StyleSheet, Pressable, PressableProps } from "react-native";
import { BlurView } from "expo-blur";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface LinkItemProps extends PressableProps {
  readonly label: string;
}

export function LinkItem({
  label,
  ...pressableProps
}: Readonly<LinkItemProps>) {
  return (
    <Pressable {...pressableProps}>
      {({ pressed }) => (
        <BlurView
          tint={pressed ? "default" : "systemUltraThinMaterialDark"}
          style={styles.item}
        >
          <Text style={styles.label}>{label}</Text>
          <IconSymbol name="chevron.right" color="#8C8C8C" size={16} />
        </BlurView>
      )}
    </Pressable>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "white",
    fontSize: 17,
    lineHeight: 22,
  },
});
