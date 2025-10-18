import { View } from "react-native";
import React from "react";

type HeaderProps = {
  left?: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
};

export default function Header({ left, center, right }: Readonly<HeaderProps>) {
  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ flex: 1, alignItems: "flex-start" }}>{left}</View>
      <View style={{ flex: 1, alignItems: "center" }}>{center}</View>
      <View style={{ flex: 1, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}
