import { Pressable } from "react-native";
import { Href, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { SFSymbols6_0 } from "sf-symbols-typescript";
import { GlassView } from "expo-glass-effect";

type HeaderButtonProps =
  | { type: "back" }
  | { type: "custom"; icon: SFSymbols6_0; route: Href };

const pressableStyle = {
  alignItems: "center" as const,
  flex: 1,
  justifyContent: "center" as const,
};

const glassViewStyle = {
  width: 44,
  height: 44,
  borderRadius: "100%" as const,
  backgroundColor: "transparent" as const,
  alignSelf: "center" as const,
  justifyContent: "center" as const,
};

const symbolViewStyle = {
  alignSelf: "center" as const,
};

export default function HeaderButton(props: HeaderButtonProps) {
  const iconName = props.type === "back" ? "chevron.left" : props.icon;

  const handlePress = () => {
    if (props.type === "back") {
      router.back();
    } else {
      router.push(props.route);
    }
  };

  return (
    <Pressable style={pressableStyle} onPress={handlePress}>
      <GlassView
        glassEffectStyle="regular"
        isInteractive={true}
        style={glassViewStyle}
      >
        <SymbolView
          name={iconName}
          tintColor="white"
          size={26}
          style={symbolViewStyle}
        />
      </GlassView>
    </Pressable>
  );
}
