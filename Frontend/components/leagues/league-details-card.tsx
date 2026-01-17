import React from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { createTeamStyles as styles } from "@/components/teams/teams-styles";
import { LeaguePickerType } from "@/components/leagues/league-form-constants";

type Props = {
  sportLabel: string;
  levelLabel: string;
  region: string;
  location: string;
  onChangeRegion: (value: string) => void;
  onChangeLocation: (value: string) => void;
  onOpenPicker: (type: LeaguePickerType) => void;
};

export function LeagueDetailsCard({
  sportLabel,
  levelLabel,
  region,
  location,
  onChangeRegion,
  onChangeLocation,
  onOpenPicker,
}: Readonly<Props>) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.chip}>
        <Text style={styles.chipText}>Details</Text>
      </View>

      <View style={styles.detailsCard}>
        <Pressable
          style={styles.detailRow}
          onPress={() => onOpenPicker("sport")}
        >
          <Text style={styles.detailLabel}>Sport</Text>
          <Text style={styles.detailValue}>{sportLabel} ⌵</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={styles.detailRow}
          onPress={() => onOpenPicker("level")}
        >
          <Text style={styles.detailLabel}>Level</Text>
          <Text style={styles.detailValue}>{levelLabel} ⌵</Text>
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Region</Text>
          <TextInput
            value={region}
            onChangeText={onChangeRegion}
            placeholder="Optional"
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={[styles.detailValue, localStyles.detailInput]}
            maxLength={120}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location</Text>
          <TextInput
            value={location}
            onChangeText={onChangeLocation}
            placeholder="Optional"
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={[styles.detailValue, localStyles.detailInput]}
            maxLength={255}
          />
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  detailInput: {
    minWidth: 140,
    textAlign: "right",
    paddingVertical: 0,
  },
});
