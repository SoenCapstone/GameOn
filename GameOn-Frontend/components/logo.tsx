import { GlassView } from "expo-glass-effect";
import { Image } from "expo-image";

export function Logo() {
  return (
    <GlassView style={{ width: 44, height: 44, borderRadius: 12 }}>
      <Image
        source={require("@/assets/images/logo.png")}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        contentFit="contain"
      />
    </GlassView>
  );
}
