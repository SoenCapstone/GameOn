import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { GlassView } from "expo-glass-effect";

interface TabsProps {
  readonly values: string[];
  readonly selectedIndex: number;
  readonly onValueChange: (value: string) => void;
}

export function Tabs({
  values,
  selectedIndex,
  onValueChange,
}: Readonly<TabsProps>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {values.map((value, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Pressable
            key={`${value}-${index}`}
            onPress={() => onValueChange(value)}
            style={styles.pressable}
          >
            <GlassView
              isInteractive
              tintColor={isSelected ? "white" : undefined}
              style={styles.glass}
            >
              <Text style={[styles.text, isSelected && styles.textSelected]}>
                {value}
              </Text>
            </GlassView>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    overflow: "visible",
    marginBottom: 4,
  },
  content: {
    flexDirection: "row",
    paddingHorizontal: 4,
    gap: 8,
  },
  pressable: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  glass: {
    flex: 1,
    paddingHorizontal: 20,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  textSelected: {
    color: "black",
  },
});
