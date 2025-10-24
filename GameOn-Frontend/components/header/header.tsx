import { StyleSheet, View } from "react-native";
import React from "react";

type HeaderProps = {
  left?: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
};

export function Header({ left, center, right }: Readonly<HeaderProps>) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>{left}</View>
      <View style={styles.center}>{center}</View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  left: {
    flex: 1,
    alignItems: "flex-start",
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  right: {
    flex: 1,
    alignItems: "flex-end",
  },
});
