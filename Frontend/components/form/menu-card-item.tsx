import { StyleSheet, View, Text } from "react-native";
import { Image, ImageSource } from "expo-image";
import { BlurView } from "expo-blur";
import { MenuPicker } from "@/components/ui/menu-picker";

interface MenuCardItemProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly image: ImageSource;
  readonly options: readonly string[];
  readonly value: string;
  readonly onValueChange: (value: string) => void;
}

export function MenuCardItem({
  title,
  subtitle,
  image,
  options,
  value,
  onValueChange,
}: Readonly<MenuCardItemProps>) {
  return (
    <BlurView tint={"systemUltraThinMaterialDark"} style={styles.item}>
      <View style={styles.container}>
        <Image source={image} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name}>{title}</Text>
          <Text style={styles.email}>{subtitle}</Text>
        </View>
      </View>
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
    height: 80,
    borderRadius: 33,
    overflow: "hidden",
    paddingLeft: 20,
    paddingRight: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  info: { gap: 2 },
  name: {
    fontSize: 16,
    fontWeight: 600,
    color: "white",
  },
  email: {
    fontSize: 14,
    color: "rgba(235,235,245,0.6)",
  },
  image: {
    borderRadius: "100%",
    height: 50,
    width: 50,
  },
});
