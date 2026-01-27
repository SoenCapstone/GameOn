import React from "react";
import { View, Text, Pressable, Switch } from "react-native";
import { createTeamStyles as styles } from "@/components/teams/teams-styles";

type Props = Readonly<{
  isPublic: boolean;
  hasPublicAccess: boolean;
  onRequestPurchase: () => void;
  onChangePublic: (value: boolean) => void;
}>;

export function LeagueVisibilityControl({
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
                        styles.button,
                        { justifyContent: "center" },
                        pressed && { backgroundColor: "rgba(24, 14, 112, 1)", borderRadius: 12 },
                    ]}
                    >
                    <Text
                        style={[
                        styles.detailLabel,
                        { color: "#bdbdbdff", fontWeight: "600" },
                        ]}
                    >
                        Buy Public League
                    </Text>
                </Pressable>
            </View>

            <View style={styles.disclaimerContainer}>
                <Text style={styles.disclaimerText}>
                Unlock public visibility for this league
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
                <Text style={styles.detailLabel}>Set League visibility to public</Text>
                <Switch value={isPublic} onValueChange={onChangePublic} />
            </View>
        </View>
        <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>
                Public League purchased
            </Text>
        </View>
    </View>
  );
}
