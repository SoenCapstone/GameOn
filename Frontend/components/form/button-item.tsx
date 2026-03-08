import { Text, StyleSheet, Pressable, PressableProps } from "react-native";
import { SFSymbols6_0 } from "sf-symbols-typescript";
import { BlurView } from "expo-blur";
import { useAccentColor } from "@/contexts/accent-color-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface ButtonItemProps extends PressableProps {
  readonly label?: string;
  readonly button?: string;
  readonly icon?: SFSymbols6_0;
  readonly color?: string;
}

export function ButtonItem({
  label,
  button,
  icon,
  color,
  ...pressableProps
}: Readonly<ButtonItemProps>) {
  const accentColor = useAccentColor();
  const buttonColor = color ?? accentColor;
  return (
    <BlurView tint="systemUltraThinMaterialDark" style={styles.item}>
      {label !== undefined && <Text style={styles.label}>{label}</Text>}
      <Pressable {...pressableProps} style={styles.pressable}>
        {({ pressed }) => (
          <>
            {icon ? (
              <IconSymbol
                style={[
                  label && { alignSelf: "flex-end" },
                  pressed && styles.pressed,
                ]}
                name={icon}
                color={buttonColor}
                size={24}
              />
            ) : (
              <Text
                style={[
                  { color: buttonColor },
                  label && { textAlign: "right" },
                  styles.button,
                  pressed && styles.pressed,
                ]}
              >
                {button}
              </Text>
            )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "white",
    fontSize: 17,
    lineHeight: 22,
  },
  pressable: { flex: 1 },
  button: {
    fontSize: 17,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.7,
  },
});
