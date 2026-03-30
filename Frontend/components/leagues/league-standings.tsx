import { View, Text, StyleSheet } from "react-native";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";

type Standing = {
  teamId: string;
  played?: number;
  gamesPlayed?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  points?: number;
  teamName?: string;
  team?: {
    name?: string;
  };
};

type Props = Readonly<{
  standings: Standing[];
  isLoading?: boolean;
  error?: string | null;
}>;

export function LeagueStandings({ standings, isLoading, error }: Props) {
  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message="Could not load standings" />;
  }

  // ✅ Empty state (important for PR quality)
  if (!standings.length) {
    return <Empty message="No standings available" />;
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

      {/* ROWS */}
      {standings.map((item, index) => {
        const played = item.played ?? item.gamesPlayed ?? 0;
        const wins = item.wins ?? 0;
        const draws = item.draws ?? 0;
        const losses = item.losses ?? 0;
        const points = item.points ?? 0;

        return (
          <View
            key={item.teamId ?? index}
            style={[
              styles.row,
              { backgroundColor: index % 2 === 0 ? "#111" : "transparent" }, // 🔥 zebra rows
            ]}
          >
            <Text style={styles.cell}>{index + 1}</Text>

            <Text style={styles.team}>
              {item.teamName ??
                item.team?.name ??
                item.teamId?.slice(0, 6) ??
                "Team"}
            </Text>

            <Text style={styles.cell}>{played}</Text>
            <Text style={styles.cell}>{wins}</Text>
            <Text style={styles.cell}>{draws}</Text>
            <Text style={styles.cell}>{losses}</Text>
            <Text style={styles.cellBold}>{points}</Text>
          </View>
        );
      })}
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
  cellBold: {
    width: 30,
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },
  team: {
    flex: 1,
    color: "white",
    paddingLeft: 8,
  },
  errorText: {
    color: "white",
  },
});
