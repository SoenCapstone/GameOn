import React from "react";
import { StyleSheet, View, ViewStyle, ColorValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const Presets = {
  red: "#8E0000",
  orange: "#CE721D",
  purple: "#58175D",
  blue: "#0C456E",
  green: "#005D29",
} as const;

type PresetName = keyof typeof Presets;
type GradientMode = "default" | "form";

interface BackgroundBaseProps {
  mode?: GradientMode;
  style?: ViewStyle;
}

type PresetBackgroundProps = BackgroundBaseProps & {
  preset: PresetName;
  color?: never;
};

type CustomBackgroundProps = BackgroundBaseProps & {
  color: string;
  preset?: never;
};

type BackgroundProps = PresetBackgroundProps | CustomBackgroundProps;

export const Background: React.FC<BackgroundProps> = ({
  preset,
  color,
  mode = "default",
  style,
}) => {
  const baseColor: ColorValue =
    (preset && Presets[preset]) || color || Presets.blue;

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
};
