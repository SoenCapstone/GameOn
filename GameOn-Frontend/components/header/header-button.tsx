import { Pressable, StyleSheet } from "react-native";
import { Href, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { SFSymbols6_0 } from "sf-symbols-typescript";
import { GlassView } from "expo-glass-effect";

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
        glassEffectStyle="clear"
        tintColor={"rgba(0,0,0,0.65)"}
        isInteractive={true}
        style={styles.glass}
      >
        <SymbolView
          name={iconName}
          tintColor="white"
          size={26}
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
