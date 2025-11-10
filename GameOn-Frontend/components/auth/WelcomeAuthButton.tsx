import React from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import type { Href } from "expo-router"; 

type Props = {
  route: Href;
  label: string;
  style?: StyleProp<ViewStyle>;
};

export const WelcomeAuthButton: React.FC<Props> = ({ route, label, style }) => {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(route)}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
    >
      <View style={styles.content} pointerEvents="none">
        {Platform.OS !== "android" && (
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <View style={[StyleSheet.absoluteFill, styles.fallbackTint]} />
        <Text style={styles.text}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    alignSelf: "center",
    width: 350,
    height: 54,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.21)",
    marginTop: 12,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  fallbackTint: { backgroundColor: "rgba(48, 47, 47, 0.18)" },
  text: { color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },
});
