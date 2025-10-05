import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { useFeatureFlags } from "./FeatureFlagsContext";

export default function FeatureFlagsPage() {
  const { flags, toggleFlag } = useFeatureFlags();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feature Flags</Text>
      {Object.entries(flags).map(([key, value]) => (
        <View key={key} style={styles.flagRow}>
          <Text style={styles.flagName}>{key}</Text>
          <Switch value={value} onValueChange={() => toggleFlag(key as keyof typeof flags)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  flagName: {
    fontSize: 16,
  },
});
