import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";

type Props = {
  readonly performance?: {
    readonly off?: number;
    readonly def?: number;
    readonly dis?: number;
    readonly inf?: number;
  };
};

export function TeamPerformanceCardPlaceholder({ performance }: Props) {
  const LABELS: { key: "off" | "def" | "dis"; label: string }[] = [
    { key: "off", label: "OFF" },
    { key: "def", label: "DEF" },
    { key: "dis", label: "DIS" },
  ];

  const clampPct = (n: number) => {
    if (Number.isNaN(n)) return 0;
    if (n < 0) return 0;
    if (n > 100) return 100;
    return n;
  };

  return (
    <Card>
      <View style={styles.cardFill}>
        <View style={styles.performanceCard}>
          <Text style={styles.performanceTitle}>Team Performance</Text>

          <View style={styles.performanceList}>
            {LABELS.map(({ key, label }) => {
              const value = performance?.[key];
              const hasValue = value === undefined;
              const pct = hasValue ? 55 : clampPct(Number(value));

              return (
                <View key={label} style={styles.performanceRow}>
                  <Text style={styles.perfLabel}>{label}</Text>

                  <View style={styles.perfTrack}>
                    <View style={[styles.skelPerfFill, { width: `${pct}%` }]} />
                  </View>

                  {hasValue ? (
                    <View style={styles.skelPerfValue} />
                  ) : (
                    <Text style={styles.perfValueText}>{String(value)}</Text>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.rosterDivider} />

          <View style={styles.perfFooterRow}>
            <Text style={styles.perfFooterLabel}>INF</Text>

            {performance?.inf === undefined ? (
              <View style={styles.skelPerfFooter} />
            ) : (
              <Text style={styles.perfFooterValueText}>
                {String(performance.inf)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardFill: {
    margin: -24,
  },

  performanceCard: {
    borderRadius: 26,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  performanceTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },

  performanceList: {
    gap: 12,
  },

  performanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  perfLabel: {
    width: 42,
    marginRight: 10,
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },

  perfTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
    marginRight: 10,
  },

  perfValueText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "800",
    minWidth: 22,
    textAlign: "right",
  },

  perfFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 2,
  },

  perfFooterLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  perfFooterValueText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "800",
  },

  rosterDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginTop: 12,
    marginBottom: 12,
  },

  skelPerfFill: {
    width: "55%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  skelPerfValue: {
    width: 22,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  skelPerfFooter: {
    height: 12,
    width: "60%",
    alignSelf: "center",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
});
