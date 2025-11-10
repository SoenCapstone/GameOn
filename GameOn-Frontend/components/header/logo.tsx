import { GlassView } from "expo-glass-effect";
import { Image } from "expo-image";
import { StyleSheet } from "react-native";

export function Logo() {
  return (
    <GlassView style={styles.glass}>
      <Image
        source={require("@/assets/images/logo.png")}
        style={StyleSheet.absoluteFillObject}
        contentFit="contain"
      />
    </GlassView>
  );
}

const styles = StyleSheet.create({
  glass: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
});
