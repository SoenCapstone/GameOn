import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { errorToString } from "@/utils/error";
import type { TeamOverviewResponse } from "@/hooks/use-team-overview";
import { TeamPerformanceCardPlaceholder } from "@/components/teams/team-performance-card-placeholder";

type Props = {
  readonly overviewLoading: boolean;
  readonly overviewError: unknown;
  readonly overview?: TeamOverviewResponse;
  readonly tiles: TeamOverviewResponse["tiles"];
};

export function TeamOverviewTab({
  overviewLoading,
  overviewError,
  overview,
  tiles,
}: Readonly<Props>) {
  return (
    <View style={styles.overviewWrap}>
      {overviewLoading && (
        <ActivityIndicator size="small" color="#fff" style={{ marginTop: 6 }} />
      )}

      {overviewError ? (
        <Text style={styles.errorText}>
          {String(errorToString(overviewError))}
        </Text>
      ) : null}

      <Card>
        <View style={styles.cardFill}>
          <View style={styles.glassInner}>
            <View style={styles.seasonHeader}>
              <Text style={styles.seasonTitle}>
                {overview?.seasonLabel ?? "Season 2026"}
              </Text>

              {overview?.record ? (
                <Text style={styles.recordText}>{overview.record}</Text>
              ) : (
                <View style={styles.skelRecord} />
              )}
            </View>

            <View style={styles.tilesGrid}>
              {tiles.map((tile) => (
                <View key={tile.key} style={styles.statTile}>
                  <View style={styles.statTileBox}>
                    {tile.value === undefined ? (
                      <View style={styles.skelNum} />
                    ) : (
                      <Text style={styles.statValue}>{String(tile.value)}</Text>
                    )}

                    <Text style={styles.statLabel}>{tile.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.cardFill}>
          <View style={styles.rosterCard}>
            <View style={styles.rosterHeader}>
              <Text style={styles.rosterTitle}>Roster</Text>
              <View style={styles.rosterTotalWrap}>
                <Text style={styles.rosterTotalLabel}>Total</Text>

                {overview?.rosterCounts?.total === undefined ? (
                  <View style={styles.skelRosterTotal} />
                ) : (
                  <Text style={styles.rosterTotalValue}>
                    {String(overview.rosterCounts.total)}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.rosterDivider} />

            <View style={styles.rosterList}>
              <View style={styles.rosterItem}>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>Owner</Text>
                </View>

                {overview?.rosterCounts?.owner === undefined ? (
                  <View style={styles.skelCount} />
                ) : (
                  <Text style={styles.rosterCountValue}>
                    {String(overview.rosterCounts.owner)}
                  </Text>
                )}
              </View>

              <View style={styles.rosterItem}>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>Manager</Text>
                </View>

                {overview?.rosterCounts?.manager === undefined ? (
                  <View style={styles.skelCount} />
                ) : (
                  <Text style={styles.rosterCountValue}>
                    {String(overview.rosterCounts.manager)}
                  </Text>
                )}
              </View>

              <View style={styles.rosterItem}>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>Players</Text>
                </View>

                {overview?.rosterCounts?.players === undefined ? (
                  <View style={styles.skelCount} />
                ) : (
                  <Text style={styles.rosterCountValue}>
                    {String(overview.rosterCounts.players)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </Card>

      <TeamPerformanceCardPlaceholder performance={overview?.performance} />
    </View>
  );
}

const styles = StyleSheet.create({
  overviewWrap: {
    gap: 12,
  },

  errorText: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
  },

  cardFill: {
    margin: -24,
  },

  glassInner: {
    borderRadius: 26,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  seasonHeader: {
    alignItems: "center",
    marginBottom: 4,
  },

  seasonTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  recordText: {
    marginTop: 6,
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
  },

  tilesGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },

  statTile: {
    width: "50%",
    paddingHorizontal: 6,
    paddingVertical: 6,
  },

  statTileBox: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  statValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },

  statLabel: {
    color: "rgba(255,255,255,0.75)",
    marginTop: 6,
    fontSize: 12,
  },

  rosterCard: {
    borderRadius: 26,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  rosterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rosterTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  rosterTotalWrap: {
    alignItems: "flex-end",
    gap: 6,
  },

  rosterTotalLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },

  rosterTotalValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },

  rosterDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginTop: 12,
    marginBottom: 12,
  },

  rosterList: {
    gap: 10,
  },

  rosterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rosterCountValue: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
    fontWeight: "800",
  },

  rolePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  rolePillText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },

  skelNum: {
    height: 22,
    width: 44,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  skelRecord: {
    marginTop: 6,
    height: 12,
    width: 120,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  skelRosterTotal: {
    height: 22,
    width: 44,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  skelCount: {
    height: 14,
    width: 26,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
});
