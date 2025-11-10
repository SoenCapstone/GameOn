import React from "react";
import { View, Text, Switch } from "react-native";
import { useFeatureFlags } from "@/components/feature-flags/feature-flags-context";
import { styles } from "@/components/feature-flags/feature-flags-page.styles";
import { ContentArea } from "@/components/ui/content-area";


export default function FeatureFlagsPage() {
  const { flags, toggleFlag } = useFeatureFlags();

  return (
    <ContentArea
      backgroundProps={{ preset: "green" }}
    >
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
    </ContentArea>
  );
}
