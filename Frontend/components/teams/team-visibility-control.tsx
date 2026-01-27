import React from "react";
import { View, Text, Pressable, Switch } from "react-native";
import { createTeamStyles as styles } from "@/components/teams/teams-styles";

type Props = Readonly<{
  isPublic: boolean;
  hasPublicAccess: boolean;
  onRequestPurchase: () => void;
  onChangePublic: (value: boolean) => void;
}>;

export function TeamVisibilityControl({
  isPublic,
  hasPublicAccess,
  onRequestPurchase,
  onChangePublic,
}: Props) {
  if (!hasPublicAccess) {
    return (
      <View style={styles.fieldGroup}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Visibility</Text>
        </View>

        <View style={styles.detailsCard}>
          <Pressable
            onPress={onRequestPurchase}
            hitSlop={10}
            style={({ pressed }) => [
              styles.detailRow,
              { justifyContent: "center" },
              pressed && {
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 12,
              },
            ]}
          >
            <Text
              style={[
                styles.detailLabel,
                { color: "#0052ff", fontWeight: "600" },
              ]}
            >
              Buy Public Team
            </Text>
          </Pressable>
        </View>

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            Unlock public visibility for this team
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fieldGroup}>
      <View style={styles.chip}>
        <Text style={styles.chipText}>Visibility</Text>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Set team visibility to public
          </Text>
          <Switch value={isPublic} onValueChange={onChangePublic} />
        </View>
      </View>

      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>Public Team purchased</Text>
      </View>
    </View>
  );
}
