import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { createTeamStyles as styles } from "@/components/teams/teams-styles";

type Props = {
  leagueName: string;
  onChangeLeagueName: (name: string) => void;
};

export function LeagueNameField({
  leagueName,
  onChangeLeagueName,
}: Readonly<Props>) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.chip}>
        <Text style={styles.chipText}>Name</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="League Name"
          placeholderTextColor="rgba(255,255,255,0.6)"
          style={styles.textInput}
          value={leagueName}
          onChangeText={onChangeLeagueName}
          maxLength={150}
        />
        {leagueName.length > 0 && (
          <Pressable
            style={styles.clearButton}
            onPress={() => onChangeLeagueName("")}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
