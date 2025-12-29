import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";

const ICONS = [
  { name: "black", source: require("@/assets/images/icon-black.png") },
  { name: "grass", source: require("@/assets/images/icon-grass.png") },
  {
    name: "basketball",
    source: require("@/assets/images/icon-basketball.png"),
  },
  {
    name: "volleyball",
    source: require("@/assets/images/icon-volleyball.png"),
  },
  { name: "white", source: require("@/assets/images/icon-white.png") },
];

export function IconItem() {
  const [selected, setSelected] = useState("black");

  const handleIconPress = (iconName: string) => {
    setSelected(iconName);
    // Add logic for changing the app icon
  };

  return (
    <BlurView tint="systemUltraThinMaterialDark" style={styles.item}>
      {ICONS.map((icon) => (
        <Pressable
          key={icon.name}
          onPress={() => handleIconPress(icon.name)}
          style={styles.wrapper}
        >
          {selected === icon.name && <View style={styles.selected} />}
          <View style={styles.container}>
            <Image source={icon.source} style={styles.icon} />
          </View>
        </Pressable>
      ))}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  item: {
    width: "100%",
    height: 100,
    borderRadius: 37.5,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wrapper: {
    height: "100%",
    aspectRatio: 1,
  },
  container: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  icon: {
    width: "100%",
    height: "100%",
  },
  selected: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
  },
});
