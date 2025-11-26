import React from "react";
import { View, Text, Switch } from "react-native";
import { createTeamStyles as styles } from "@/components/teams/teams-styles";

type Props = {
  isPublic: boolean;
  onChangePublic: (value: boolean) => void;
};

export function TeamVisibilitySection({
  isPublic,
  onChangePublic,
}: Readonly<Props>) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.chip}>
        <Text style={styles.chipText}>Visibility</Text>
      </View>

      <View style={styles.visibilityCard}>
        <Text style={styles.visibilityLabel}>Apply for Public Team</Text>
        <Switch
          value={isPublic}
          onValueChange={onChangePublic}
          trackColor={{
            false: "rgba(255,255,255,0.2)",
            true: "rgba(3, 180, 70, 0.7)",
          }}
          thumbColor="#ffffff"
        />
      </View>
    </View>
  );
}
