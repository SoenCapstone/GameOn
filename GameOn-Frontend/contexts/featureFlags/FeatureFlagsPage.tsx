import React from "react";
import { View, Text, Switch } from "react-native";
import { useFeatureFlags } from "./FeatureFlagsContext";
import { styles } from "./FeatureFlagsPage.styles";


export default function FeatureFlagsPage() {
  const { flags, toggleFlag } = useFeatureFlags();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feature Flags</Text>
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
  );
}
