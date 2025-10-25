import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { GlassView } from "expo-glass-effect";

interface CardProps {
  readonly children: React.ReactNode;
  readonly onPress?: () => void;
}

export function Card({ children, onPress }: Readonly<CardProps>) {
  return (
    <Pressable onPress={onPress}>
      <GlassView
        isInteractive={true}
        glassEffectStyle={"clear"}
        tintColor={"rgba(0,0,0,0.4)"}
        style={styles.card}
      >
        {children}
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 24,
    borderRadius: 34,
    overflow: "hidden",
    borderStyle: "solid",
    borderColor: "rgba(108,108,113,0.1)",
    borderWidth: 1,
  },
});
