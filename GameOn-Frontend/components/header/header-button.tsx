import { Pressable } from "react-native";
import { Href, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { SFSymbols6_0 } from "sf-symbols-typescript";
import { GlassView } from "expo-glass-effect";

type HeaderButtonProps =
  | { type: "back" }
  | { type: "custom"; icon: SFSymbols6_0; route: Href };

export default function HeaderButton(props: HeaderButtonProps) {
  const iconName = props.type === "back" ? "chevron.left" : props.icon;

  return (
    <Pressable
      style={{
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
      }}
      onPress={() => {
        if (props.type === "back") {
          router.back();
        } else {
          router.push(props.route);
        }
      }}
    >
      <GlassView
        glassEffectStyle="regular"
        isInteractive={true}
        style={{
          width: 44,
          height: 44,
          borderRadius: "100%",
          backgroundColor: "transparent",
          alignSelf: "center",
          justifyContent: "center",
        }}
      >
        <SymbolView
          name={iconName}
          tintColor="white"
          size={26}
          style={{ alignSelf: "center" }}
        />
      </GlassView>
    </Pressable>
  );
}
