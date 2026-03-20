import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";

type Props = {
  standings: any[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function LeagueStandings({
  standings,
  isLoading,
  error,
  onRetry,
}: Props) {
  if (isLoading) {
    return <ActivityIndicator size="small" color="#fff" />;
  }

  if (error) {
    return (
      <View>
        <Text style={{ color: "white" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.cell}>#</Text>
        <Text style={styles.team}>Team</Text>
        <Text style={styles.cell}>P</Text>
        <Text style={styles.cell}>W</Text>
        <Text style={styles.cell}>D</Text>
        <Text style={styles.cell}>L</Text>
        <Text style={styles.cell}>PTS</Text>
      </View>

      <FlatList
        data={standings}
        keyExtractor={(item) => item.teamId}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{index + 1}</Text>

            {/* TEMP NAME (we fix later) */}
            <Text style={styles.team}>Team {index + 1}</Text>

            <Text style={styles.cell}>{item.played}</Text>
            <Text style={styles.cell}>{item.wins}</Text>
            <Text style={styles.cell}>{item.draws}</Text>
            <Text style={styles.cell}>{item.losses}</Text>

            <Text style={styles.cell}>{item.points}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#444",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#333",
  },
  cell: {
    width: 30,
    textAlign: "center",
    color: "white",
  },
  team: {
    flex: 1,
    color: "white",
  },
});