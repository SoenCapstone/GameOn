import React, { ReactNode } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";

type Props = {
  route?: Href;
  onPress?: () => void;
  label: string | ReactNode;
};

export const WelcomeAuthButton: React.FC<Props> = ({
  route,
  label,
  onPress,
}) => {
  const router = useRouter();
  const Button = isLiquidGlassAvailable() ? GlassView : BlurView;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={route ? () => router.push(route) : onPress}
      style={styles.pressable}
    >
      <Button
        isInteractive={true}
        style={[styles.button, isLiquidGlassAvailable() ? null : styles.blur]}
      >
        <Text style={styles.text}>{label}</Text>
      </Button>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: "100%",
    height: 48,
    borderRadius: 100,
    alignSelf: "center",
    justifyContent: "center",
  },
  blur: {
    overflow: "hidden",
    borderStyle: "solid",
    borderColor: "rgba(191,191,191,0.2)",
    borderWidth: 1,
  },
  text: {
    color: "#BFBFBF",
    fontSize: 17,
    alignSelf: "center",
    fontWeight: "500",
  },
});
