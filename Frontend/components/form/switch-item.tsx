import { Text, StyleSheet, Switch, SwitchProps } from "react-native";
import { BlurView } from "expo-blur";
import { useAccentColor } from "@/contexts/accent-color-context";

interface SwitchItemProps extends SwitchProps {
  readonly label: string;
}

export function SwitchItem({
  label,
  ...switchProps
}: Readonly<SwitchItemProps>) {
  const accentColor = useAccentColor();
  const trackColor = switchProps.trackColor ?? { true: accentColor };
  return (
    <BlurView tint="systemUltraThinMaterialDark" style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <Switch trackColor={trackColor} {...switchProps} style={styles.switch} />
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
    paddingRight: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "white",
    fontSize: 17,
    lineHeight: 22,
  },
  switch: {
    alignSelf: "center",
  },
});
