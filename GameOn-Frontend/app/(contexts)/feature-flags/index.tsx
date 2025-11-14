import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { useFeatureFlags } from "@/components/feature-flags/feature-flags-context";
import { ContentArea } from "@/components/ui/content-area";

export default function FeatureFlagsPage() {
  const { flags, toggleFlag } = useFeatureFlags();

  return (
    <ContentArea backgroundProps={{ preset: "orange" }}>
      <View style={styles.container}>
        {Object.entries(flags).map(([key, value]) => (
          <View key={key} style={styles.flagRow}>
            <Text style={styles.flagName}>{key}</Text>
            <Switch
              value={value}
              onValueChange={() => toggleFlag(key as keyof typeof flags)}
            />
          </View>
        ))}
      </View>
    </ContentArea>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 14,
    padding: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "white",
  },
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  flagName: {
    fontSize: 16,
    color: "white",
  },
});
