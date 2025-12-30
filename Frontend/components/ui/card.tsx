import React from "react";
import { StyleSheet } from "react-native";
import { GlassView } from "expo-glass-effect";

interface CardProps {
  readonly children: React.ReactNode;
}

export function Card({ children }: Readonly<CardProps>) {
  return (
    <GlassView
      isInteractive={true}
      glassEffectStyle={"clear"}
      tintColor={"rgba(0,0,0,0.5)"}
      style={styles.card}
    >
      {children}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 24,
    borderRadius: 34,

  },
});
