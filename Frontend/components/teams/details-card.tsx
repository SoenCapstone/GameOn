import React from "react";
import { View, Text, Pressable } from "react-native";
import { createTeamStyles as styles } from "@/components/teams/teams-styles";

type PickerType = "sport" | "scope" | "city";

type Props = {
  sportLabel: string;
  scopeLabel: string;
  cityLabel: string;
  onOpenPicker: (type: PickerType) => void;
};

export function TeamDetailsCard({
  sportLabel,
  scopeLabel,
  cityLabel,
  onOpenPicker,
}: Readonly<Props>) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.chip}>
        <Text style={styles.chipText}>Details</Text>
      </View>

      <View style={styles.detailsCard}>
        {/* Sports */}
        <Pressable
          style={styles.detailRow}
          onPress={() => onOpenPicker("sport")}
        >
          <Text style={styles.detailLabel}>Sports</Text>
          <Text style={styles.detailValue}>{sportLabel} ⌵</Text>
        </Pressable>

        <View style={styles.divider} />

        {/* Scope */}
        <Pressable
          style={styles.detailRow}
          onPress={() => onOpenPicker("scope")}
        >
          <Text style={styles.detailLabel}>Scope</Text>
          <Text style={styles.detailValue}>{scopeLabel} ⌵</Text>
        </Pressable>

        <View style={styles.divider} />

        {/* Location / City */}
        <Pressable
          style={styles.detailRow}
          onPress={() => onOpenPicker("city")}
        >
          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailValue}>{cityLabel} ⌵</Text>
        </Pressable>
      </View>
    </View>
  );
}
