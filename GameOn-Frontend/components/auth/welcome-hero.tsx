import React, { useEffect, useRef } from "react";
import { View, Image, Animated, Easing, StyleSheet, Text } from "react-native";
import { images } from "@/constants/images";

export const WelcomeHero: React.FC<{
  top: number;
  styleRenderWidth: number;
  styleRenderHeight: number;
}> = ({ top, styleRenderWidth, styleRenderHeight }) => {
  const gap = 20;
  const logos = [
    images.white,
    images.grass,
    images.basketball,
    images.volleyball,
    images.black,
  ];

  const rowWidth = logos.length * styleRenderWidth + gap * logos.length;

  const x = useRef(new Animated.Value(0)).current;
  const pxPerSec = 30;
  const duration = Math.max(2000, (rowWidth / pxPerSec) * 1000);

  const animate = () => {
    x.setValue(0);
    Animated.timing(x, {
      toValue: -rowWidth,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => finished && animate());
  };

  useEffect(() => {
    animate();
  });

  const renderRow = (keyPrefix: string) => (
    <View key={keyPrefix} style={{ flexDirection: "row", marginRight: gap }}>
      {logos.map((src, i) => (
        <Image
          key={`${keyPrefix}-${i}`}
          source={src}
          style={{
            width: styleRenderWidth,
            height: styleRenderHeight,
            // gap between items within a row
            marginRight: i < logos.length - 1 ? gap : 0,
          }}
          resizeMode="contain"
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.hero, { top }]}>
      <View style={{ width: "100%", height: styleRenderHeight }}>
        <Animated.View
          style={{ flexDirection: "row", transform: [{ translateX: x }] }}
        >
          {renderRow("rowA")}
          {renderRow("rowB")}
        </Animated.View>
      </View>
      <View>
        <Text
          accessibilityRole="header"
          style={{
            color: "white",
            fontSize: 28,
            fontWeight: "bold",
          }}
        >
          Welcome to GameOn
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: 64,
  },
});
