import { Text, StyleSheet, Pressable, PressableProps } from "react-native";
import { BlurView } from "expo-blur";
import { useAccentColor } from "@/contexts/accent-color-context";

interface ButtonItemProps extends PressableProps {
  readonly label: string;
  readonly color?: string;
}

export function ButtonItem({
  label,
  color,
  ...pressableProps
}: Readonly<ButtonItemProps>) {
  const accentColor = useAccentColor();
  const buttonColor = color ?? accentColor;
  return (
    <Pressable {...pressableProps}>
      {({ pressed }) => (
        <BlurView
          tint={pressed ? "default" : "systemUltraThinMaterialDark"}
          style={styles.item}
        >
          <Text style={[{ color: buttonColor }, styles.label]}>{label}</Text>
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
    alignItems: "center",
  },
  label: {
    fontSize: 17,
    lineHeight: 22,
  },
});
