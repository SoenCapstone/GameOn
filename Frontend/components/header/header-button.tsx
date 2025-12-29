import { Pressable, StyleSheet, Text } from "react-native";
import { Href, router } from "expo-router";
import React from "react";
import { SFSymbols6_0 } from "sf-symbols-typescript";
import { GlassView } from "expo-glass-effect";
import { IconSymbol } from "@/components/ui/icon-symbol";

type HeaderButtonProps =
  | { type: "back" }
  | {
      type: "custom";
      icon?: SFSymbols6_0;
      route?: Href;
      onPress?: () => void;
      label?: string;
    };

export function HeaderButton(props: HeaderButtonProps) {
  const isLabel = props.type === "custom" && !!props.label;
  const iconName = props.type === "back" ? "chevron.left" : props.icon;

  return (
    <Pressable
      style={styles.button}
      onPress={() => {
        if (props.type === "back") {
          router.back();
        } else {
          if (props.onPress) {
            props.onPress();
          } else if (props.route) {
            router.push(props.route);
          }
        }
      }}
    >
      <GlassView
        glassEffectStyle="regular"
        isInteractive={true}
        style={isLabel ? styles.glassLabel : styles.glass}
      >
        {isLabel ? (
          <Text style={styles.labelText}>{props.label}</Text>
        ) : (
          <IconSymbol
            name={iconName as SFSymbols6_0}
            size={26}
            color="white"
            style={styles.symbol}
          />
        )}
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
    borderRadius: 100,
    backgroundColor: "transparent",
    alignSelf: "center",
    justifyContent: "center",
  },
  glassLabel: {
    minWidth: 96,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "transparent",
    alignSelf: "center",
    justifyContent: "center",
  },
  symbol: {
    alignSelf: "center",
  },
  labelText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
