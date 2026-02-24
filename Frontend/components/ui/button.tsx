import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { Href, router } from "expo-router";
import React from "react";
import { SFSymbols6_0 } from "sf-symbols-typescript";
import { GlassView } from "expo-glass-effect";
import { Image, type ImageSource } from "expo-image";
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
      image?: ImageSource;
      imageSize?: number;
      iconSize?: number;
      isInteractive?: boolean;
      circle?: boolean;
    };

export function Button(props: ButtonProps) {
  const isLabel = props.type === "custom" && !!props.label;
  const hasImage = props.type === "custom" && !!props.image;
  const iconName = props.type === "back" ? "chevron.left" : props.icon;
  const isLoading = props.type === "custom" && props.loading;
  const iconSize = props.type === "custom" ? (props.iconSize ?? 26) : 26;
  const imageSize = props.type === "custom" ? (props.imageSize ?? 36) : 36;
  const isInteractive =
    props.type === "custom" ? (props.isInteractive ?? true) : true;
  const isCircle = props.type === "custom" && props.circle;

  const renderContent = () => {
    if (isLoading) {
      return (
        <ActivityIndicator style={styles.center} color="white" size="small" />
      );
    }
    if (hasImage && props.type === "custom" && props.image) {
      return (
        <Image
          source={props.image}
          style={[
            styles.center,
            { width: imageSize, height: imageSize },
            isCircle && styles.circle,
          ]}
          contentFit="contain"
        />
      );
    }
    if (isLabel) {
      return <Text style={styles.label}>{props.label}</Text>;
    }
    return (
      <IconSymbol
        name={iconName as SFSymbols6_0}
        size={iconSize}
        color="white"
        style={styles.center}
      />
    );
  };

  return (
    <Pressable
      style={styles.button}
      disabled={!isInteractive}
      onPress={() => {
        if (!isInteractive) return;
        if (props.type === "back") {
          router.back();
        } else if (props.type === "custom" && props.onPress) {
          props.onPress();
        } else if (props.type === "custom" && props.route) {
          router.push(props.route);
        }
      }}
    >
      <GlassView
        glassEffectStyle="regular"
        isInteractive={isInteractive}
        style={styles.glass}
      >
        {renderContent()}
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
  center: {
    alignSelf: "center",
  },
  circle: { borderRadius: 100 },
  label: {
    color: "white",
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
