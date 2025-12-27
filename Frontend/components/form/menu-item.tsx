import { Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { MenuPicker } from "@/components/ui/menu-picker";

interface MenuItemProps {
  readonly label: string;
  readonly options: readonly string[];
  readonly value: string;
  readonly onValueChange: (value: string) => void;
}

export function MenuItem({
  label,
  options,
  value,
  onValueChange,
}: Readonly<MenuItemProps>) {
  return (
    <BlurView tint="systemUltraThinMaterialDark" style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <MenuPicker
        options={options}
        value={value}
        onValueChange={onValueChange}
      />
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
    paddingRight: 8,
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
