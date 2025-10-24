import { GlassView } from "expo-glass-effect";
import { Image } from "expo-image";
import { StyleSheet } from "react-native";

export function Logo() {
  return (
    <GlassView style={{ width: 44, height: 44, borderRadius: 14 }}>
      <Image
        source={require("@/assets/images/logo.png")}
        style={StyleSheet.absoluteFillObject}
        contentFit="contain"
      />
    </GlassView>
  );
}
