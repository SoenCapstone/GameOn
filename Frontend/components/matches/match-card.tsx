import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { getSportLogo } from "@/components/browse/utils";
import { formatMatchDateTime } from "@/features/matches/utils";
import { Card } from "@/components/ui/card";

interface MatchCardProps {
  readonly homeName: string;
  readonly awayName: string;
  readonly homeLogoUrl?: string | null;
  readonly awayLogoUrl?: string | null;
  readonly sport?: string | null;
  readonly contextLabel: string;
  readonly status: string;
  readonly startTime: string;
  readonly isPast: boolean;
  readonly homeScore?: number | null;
  readonly awayScore?: number | null;
  readonly onPress?: () => void;
}

export function MatchCard({
  homeName,
  awayName,
  homeLogoUrl,
  awayLogoUrl,
  sport,
  contextLabel,
  status,
  startTime,
  isPast,
  homeScore,
  awayScore,
  onPress,
}: Readonly<MatchCardProps>) {
  const renderCenterValue = () => {
    if (status === "CANCELLED") {
      return <Text style={styles.pending}>Cancelled</Text>;
    }

    const hasScore = homeScore !== undefined && awayScore !== undefined;
    if (hasScore) {
      return (
        <View style={styles.result}>
          <Text style={[styles.score, styles.side]} numberOfLines={1}>
            {homeScore}
          </Text>
          <Text style={[styles.score, styles.dash]}>-</Text>
          <Text style={[styles.score, styles.side]} numberOfLines={1}>
            {awayScore}
          </Text>
        </View>
      );
    }

    return <Text style={styles.date}>{formatMatchDateTime(startTime)}</Text>;
  };

  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={styles.content}>
          <View style={styles.top}>
            <Image
              source={homeLogoUrl ? { uri: homeLogoUrl } : getSportLogo(sport)}
              style={styles.logo}
              contentFit="contain"
            />

            <View style={styles.middle}>
              <Text style={styles.league} numberOfLines={1}>
                {contextLabel}
              </Text>
              {renderCenterValue()}
            </View>

            <Image
              source={awayLogoUrl ? { uri: awayLogoUrl } : getSportLogo(sport)}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <View style={styles.names}>
            <View style={styles.home}>
              <Text style={styles.name} numberOfLines={1}>
                {homeName}
              </Text>
            </View>
            <View style={styles.away}>
              <Text style={styles.name} numberOfLines={1}>
                {awayName}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function MatchSkeletonCard() {
  return (
    <Card isInteractive={false}>
      <View>
        <View style={[styles.skeleton, styles.header]} />
        <View style={[styles.skeleton, styles.line]} />
        <View style={[styles.skeleton, styles.line]} />
        <View style={[styles.skeleton, styles.footer]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  logo: {
    width: 48,
    height: 48,
  },
  middle: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    maxWidth: "55%",
  },
  league: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 12,
    lineHeight: 16,
  },
  date: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  result: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 24,
    lineHeight: 28,
  },
  side: {
    width: 34,
    fontWeight: "500",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  dash: {
    width: 40,
    fontWeight: "400",
    textAlign: "center",
  },
  pending: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 13,
    textAlign: "center",
  },
  names: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  home: {
    minWidth: 76,
    alignItems: "center",
  },
  name: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  away: {
    minWidth: 76,
    alignItems: "center",
  },
  skeleton: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 8,
  },
  header: {
    height: 18,
    width: "55%",
    marginBottom: 12,
  },
  line: {
    height: 16,
    width: "85%",
    marginBottom: 8,
  },
  footer: {
    height: 14,
    width: "40%",
  },
});
