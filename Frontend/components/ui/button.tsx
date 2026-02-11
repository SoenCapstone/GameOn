import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { Href, router } from "expo-router";
import React from "react";
import { SFSymbols6_0 } from "sf-symbols-typescript";
import { GlassView } from "expo-glass-effect";
import { IconSymbol } from "@/components/ui/icon-symbol";

type ButtonProps =
  | { type: "back" }
  | {
      type: "custom";
      icon?: SFSymbols6_0;
      route?: Href;
      onPress?: () => void;
      label?: string;
      loading?: boolean;
    };

export function Button(props: ButtonProps) {
  const isLabel = props.type === "custom" && !!props.label;
  const iconName = props.type === "back" ? "chevron.left" : props.icon;
  const isLoading = props.type === "custom" && props.loading;

  const renderLabel = () => {
    if (isLoading) {
      return (
        <ActivityIndicator style={styles.symbol} color="white" size="small" />
      );
    }
    if (isLabel) {
      return <Text style={styles.labelText}>{props.label}</Text>;
    }
    return (
      <IconSymbol
        name={iconName as SFSymbols6_0}
        size={26}
        color="white"
        style={styles.symbol}
      />
    );
  };

  return (
    <Pressable
      style={styles.button}
      onPress={() => {
        if (props.type === "back") {
          router.back();
        } else if (props.onPress) {
          props.onPress();
        } else if (props.route) {
          router.push(props.route);
        }
      }}
    >
      <GlassView
        glassEffectStyle="regular"
        isInteractive={true}
        style={styles.glass}
      >
        {renderLabel()}
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
    minWidth: 44,
    height: 44,
    borderRadius: 100,
    backgroundColor: "transparent",
    alignSelf: "center",
    justifyContent: "center",
  },
  glassLabel: {
    height: 44,
    borderRadius: 100,
    backgroundColor: "transparent",
    alignSelf: "center",
    justifyContent: "center",
  },
  symbol: {
    alignSelf: "center",
  },
  labelText: {
    color: "white",
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
