import { Pressable, StyleSheet } from "react-native";
import { Href, router } from "expo-router";
import React from "react";
import { SFSymbols6_0 } from "sf-symbols-typescript";
import { GlassView } from "expo-glass-effect";
import { IconSymbol } from "@/components/ui/icon-symbol";

type HeaderButtonProps =
  | { type: "back" }
  | { type: "custom"; icon: SFSymbols6_0; route: Href };

export function HeaderButton(props: HeaderButtonProps) {
  const iconName = props.type === "back" ? "chevron.left" : props.icon;

  return (
    <Pressable
      style={styles.button}
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
        style={styles.glass}
      >
        <IconSymbol
          name={iconName}
          size={26}
          color="white"
          style={styles.symbol}
        />
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  glass: {
    width: 44,
    height: 44,
    borderRadius: "100%",
    backgroundColor: "transparent",
    alignSelf: "center",
    justifyContent: "center",
  },
  symbol: {
    alignSelf: "center",
  },
});
