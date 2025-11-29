import React from "react";
import { StyleSheet, View, ViewStyle, ColorValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Color, Colors } from "@/constants/colors";

type GradientMode = "default" | "form";

interface BackgroundBaseProps {
  mode?: GradientMode;
  style?: ViewStyle;
}

type PresetBackgroundProps = BackgroundBaseProps & {
  preset: Color;
  color?: never;
};

type CustomBackgroundProps = BackgroundBaseProps & {
  color: string;
  preset?: never;
};

type BackgroundProps = PresetBackgroundProps | CustomBackgroundProps;

export function Background({
  preset,
  color,
  mode = "default",
  style,
}: Readonly<BackgroundProps>) {
  const baseColor: ColorValue =
    (preset && Colors[preset]) || color || Colors.blue;

  const locations = mode === "form" ? ([0, 0.3] as const) : ([0, 0.8] as const);

  const colors = [baseColor, "#00000080"] as const;

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <LinearGradient
        colors={colors}
        locations={locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
