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
    <BlurView tint="systemUltraThinMaterialDark" style={styles.item}>
      <Pressable {...pressableProps} style={styles.pressable}>
        {({ pressed }) => (
          <>
            <Text style={[styles.label, pressed && styles.pressed]}>{label}</Text>
            <IconSymbol
              name="chevron.right"
              color="#8C8C8C"
              size={16}
              style={pressed && styles.pressed}
            />
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
  pressed: {
    opacity: 0.7,
  },
});
