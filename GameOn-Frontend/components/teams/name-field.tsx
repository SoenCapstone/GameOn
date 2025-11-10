import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { createTeamStyles as styles } from "@/components/teams/teams-styles";

type Props = {
  teamName: string;
  onChangeTeamName: (name: string) => void;
};

export function TeamNameField({
  teamName,
  onChangeTeamName,
}: Readonly<Props>) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.chip}>
        <Text style={styles.chipText}>Name</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Team Name"
          placeholderTextColor="rgba(255,255,255,0.6)"
          style={styles.textInput}
          value={teamName}
          onChangeText={onChangeTeamName}
        />
        {teamName.length > 0 && (
          <Pressable
            style={styles.clearButton}
            onPress={() => onChangeTeamName("")}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
