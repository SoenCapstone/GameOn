import React, { useEffect, useRef } from "react";
import { View, Image, Animated, Easing } from "react-native";
import { authStyles } from "@/constants/auth-styles";
import { images } from "@/constants/images";

export const DisplayLogo: React.FC<{
  top: number;
  styleRenderWidth: number;
  styleRenderHeight: number;
}> = ({ top, styleRenderWidth, styleRenderHeight }) => {
  const gap = 20;
  const logos = [images.logo1, images.logo2, images.logo3];

  const rowWidth =
    logos.length * styleRenderWidth + gap * logos.length; 

  const x = useRef(new Animated.Value(0)).current;
  const pxPerSec = 80;
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
  }, [rowWidth, duration]);

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
    <View style={[authStyles.hero, { top }]}>
      <View style={{ width: "100%", height: styleRenderHeight, overflow: "hidden" }}>
        <Animated.View
          style={{ flexDirection: "row", transform: [{ translateX: x }] }}
        >
          {renderRow("rowA")}
          {renderRow("rowB")}
        </Animated.View>
      </View>
    </View>
  );
};

