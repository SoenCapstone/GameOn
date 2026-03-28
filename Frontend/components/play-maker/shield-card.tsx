import React from "react";
import { View, StyleSheet } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Path } from "react-native-svg";

export const CARD_WIDTH = 220;
export const CARD_HEIGHT = 360;

const shieldPath = `
  M 42 12
  Q 58 0 86 0
  L 134 0
  Q 162 0 178 12
  Q 204 24 206 52
  L 206 285
  Q 206 308 186 320
  L 110 360
  L 34 320
  Q 14 308 14 285
  L 14 52
  Q 16 24 42 12
  Z
`;

type CardShellProps = {
  children: React.ReactNode;
  topColor: string;
  bottomColor: string;
  borderColor: string;
};

export function CardShell({
  children,
  topColor,
  bottomColor,
  borderColor,
}: CardShellProps) {
  return (
    <View style={styles.wrapper}>
      <MaskedView
        style={styles.wrapper}
        maskElement={
          <Svg width={CARD_WIDTH} height={CARD_HEIGHT} viewBox="0 0 220 360">
            <Path d={shieldPath} fill="black" />
          </Svg>
        }
      >
        <View style={styles.maskedContent}>
          <View style={[styles.topBg, { backgroundColor: topColor }]} />
          <View style={[styles.bottomBg, { backgroundColor: bottomColor }]} />
          <View style={styles.shine1} />
          <View style={styles.shine2} />
          {children}
        </View>
      </MaskedView>

      <Svg
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        viewBox="0 0 220 360"
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      >
        <Path d={shieldPath} fill="none" stroke={borderColor} strokeWidth={3} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "transparent",
  },
  maskedContent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  topBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  bottomBg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT - 150,
  },
  shine1: {
    position: "absolute",
    top: 35,
    left: -20,
    width: 280,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.10)",
    transform: [{ rotate: "-18deg" }],
  },
  shine2: {
    position: "absolute",
    top: 65,
    left: -20,
    width: 280,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    transform: [{ rotate: "-18deg" }],
  },
});
