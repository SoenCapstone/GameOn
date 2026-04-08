import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { getSportLogo } from "@/utils/search";
import { GlassView } from "expo-glass-effect";
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
  goalDifference?: number;
  teamName?: string;
  logoUrl?: string;
  team?: {
    name?: string;
  };
};

type Props = Readonly<{
  standings: Standing[];
  isLoading?: boolean;
  error?: string | null;
  sport?: string | null;
}>;

export function LeagueStandings({ standings, isLoading, error, sport }: Props) {
  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message={error} />;
  }

  if (!standings.length) {
    return <Empty message="No standings available" />;
  }

  return (
    <GlassView style={styles.container}>
      <View style={styles.headerInner}>
        <View style={styles.header}>
          <Text style={styles.rankHeader}></Text>
          <View style={styles.teamColumn}>
            <Text style={styles.teamHeader}>Team</Text>
          </View>
          <Text style={styles.statHeader}>GP</Text>
          <Text style={styles.statHeader}>W</Text>
          <Text style={styles.statHeader}>D</Text>
          <Text style={styles.statHeader}>L</Text>
          <Text style={styles.statHeader}>GD</Text>
          <Text style={styles.pointsHeader}>PTS</Text>
        </View>
      </View>

      <View style={styles.rowsContainer}>
        {standings.map((item, index) => {
          const played = item.played ?? item.gamesPlayed ?? 0;
          const wins = item.wins ?? 0;
          const draws = item.draws ?? 0;
          const losses = item.losses ?? 0;
          const points = item.points ?? 0;
          const logoUrl = item.logoUrl;
          const goalDifference = item.goalDifference ?? 0;

          return (
            <View key={item.teamId ?? index} style={styles.row}>
              <Text style={styles.rankCell}>{index + 1}</Text>

              <View style={styles.teamColumn}>
                <Image
                  source={logoUrl ? { uri: logoUrl } : getSportLogo(sport)}
                  style={styles.logo}
                  contentFit="contain"
                />
                <Text style={styles.teamText} numberOfLines={1}>
                  {item.teamName ??
                    item.team?.name ??
                    item.teamId?.slice(0, 6) ??
                    "Team"}
                </Text>
              </View>

              <Text style={styles.statCell}>{played}</Text>
              <Text style={styles.statCell}>{wins}</Text>
              <Text style={styles.statCell}>{draws}</Text>
              <Text style={styles.statCell}>{losses}</Text>
              <Text style={styles.statCell}>
                {`${goalDifference >= 0 ? "+" : ""}${goalDifference}`}
              </Text>
              <Text style={styles.pointsCell}>{points}</Text>
            </View>
          );
        })}
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 34,
    overflow: "hidden",
    paddingRight: 7,
    paddingLeft: 4,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerInner: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowsContainer: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    paddingBottom: 4,
  },
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    minHeight: 26,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  rankHeader: {
    width: 24,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  rankCell: {
    width: 24,
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "500",
  },

  teamColumn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  teamHeader: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },
  teamText: {
    flex: 1,
    color: "white",
    fontSize: 14,
    lineHeight: 18,
    marginLeft: 6,
  },

  statHeader: {
    width: 28,
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
  },
  statCell: {
    width: 28,
    textAlign: "center",
    color: "white",
    fontSize: 13,
  },

  pointsHeader: {
    width: 32,
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
  },
  pointsCell: {
    width: 32,
    textAlign: "center",
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },

  logo: {
    width: 22,
    height: 22,
  },
});
