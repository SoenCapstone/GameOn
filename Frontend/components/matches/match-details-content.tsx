import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ContentArea } from "@/components/ui/content-area";
import { Card } from "@/components/ui/card";
import { formatMatchDateTime, toBadgeStatus } from "@/features/matches/utils";
import { matchStyles, statusColors } from "@/components/matches/match-styles";

interface MatchDetailsContentProps {
  readonly startTime: string;
  readonly status: string;
  readonly homeTeamName: string;
  readonly awayTeamName: string;
  readonly refereeText: string;
  readonly venueText: string;
  readonly canCancel: boolean;
  readonly onConfirmCancel: () => Promise<void>;
}

export function MatchDetailsContent({
  startTime,
  status,
  homeTeamName,
  awayTeamName,
  refereeText,
  venueText,
  canCancel,
  onConfirmCancel,
}: Readonly<MatchDetailsContentProps>) {
  const badgeStatus = toBadgeStatus(status);

  return (
    <ContentArea scrollable backgroundProps={{ preset: "red", mode: "form" }}>
      <Card>
        <View style={{ gap: 12 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.team}>{homeTeamName}</Text>
            <Text style={styles.vs}>vs</Text>
            <Text style={styles.team}>{awayTeamName}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.meta}>{formatMatchDateTime(startTime)}</Text>
            <View
              style={[
                matchStyles.badge,
                { backgroundColor: statusColors[badgeStatus] ?? "rgba(44,106,189,0.95)" },
              ]}
            >
              <Text style={matchStyles.badgeText}>{badgeStatus}</Text>
            </View>
          </View>

          <Text style={styles.meta}>{refereeText}</Text>
          <Text style={styles.meta}>{venueText}</Text>
        </View>
      </Card>

      {canCancel ? (
        <Pressable
          style={styles.cancelButton}
          onPress={() => {
            Alert.alert("Cancel match", "Are you sure you want to cancel this match?", [
              { text: "Keep", style: "cancel" },
              {
                text: "Cancel Match",
                style: "destructive",
                onPress: () => {
                  void onConfirmCancel();
                },
              },
            ]);
          }}
        >
          <Text style={styles.cancelText}>Cancel Match</Text>
        </Pressable>
      ) : null}
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  team: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    flex: 1,
  },
  vs: {
    color: "rgba(255,255,255,0.75)",
    fontWeight: "700",
  },
  meta: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
  },
  cancelButton: {
    borderRadius: 999,
    backgroundColor: "rgba(255,0,0,0.22)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  cancelText: {
    color: "#ffb3b3",
    fontWeight: "700",
  },
});
