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
  startTime,
  isPast,
  homeScore,
  awayScore,
  onPress,
}: Readonly<MatchCardProps>) {
  const renderCenterValue = () => {
    if (!isPast) {
      return (
        <Text style={styles.dateText}>{formatMatchDateTime(startTime)}</Text>
      );
    }

    const hasScore = homeScore !== undefined && awayScore !== undefined;
    if (hasScore) {
      return (
        <Text style={styles.scoreText}>
          {homeScore} - {awayScore}
        </Text>
      );
    }

    return <Text style={styles.scorePending}>Score unavailable</Text>;
  };

  return (
    <Pressable onPress={onPress} style={styles.cardPressable}>
      <Card>
        <View style={styles.card}>
          <View style={styles.contentRow}>
            <View style={styles.sideColumn}>
              <Image
                source={
                  homeLogoUrl ? { uri: homeLogoUrl } : getSportLogo(sport)
                }
                style={styles.teamLogo}
                contentFit="contain"
              />
              <Text style={styles.teamName} numberOfLines={1}>
                {homeName}
              </Text>
            </View>

            <View style={styles.centerColumn}>
              <Text style={styles.contextLabel} numberOfLines={1}>
                {contextLabel}
              </Text>
              {renderCenterValue()}
            </View>

            <View style={styles.sideColumn}>
              <Image
                source={
                  awayLogoUrl ? { uri: awayLogoUrl } : getSportLogo(sport)
                }
                style={styles.teamLogo}
                contentFit="contain"
              />
              <Text style={styles.teamName} numberOfLines={1}>
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
        <View style={[styles.skeletonBlock, styles.skeletonHeader]} />
        <View style={[styles.skeletonBlock, styles.skeletonLine]} />
        <View style={[styles.skeletonBlock, styles.skeletonLine]} />
        <View style={[styles.skeletonBlock, styles.skeletonFooter]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardPressable: {
    borderRadius: 34,
    overflow: "hidden",
  },
  card: {
    borderRadius: 28,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  sideColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 8,
    gap: 10,
  },
  centerColumn: {
    flex: 1.1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 4,
    gap: 6,
  },
  teamLogo: {
    width: 60,
    height: 60,
    borderRadius: 42,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  teamName: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
    maxWidth: "100%",
    paddingHorizontal: 6,
  },
  contextLabel: {
    color: "rgba(235,235,245,0.52)",
    fontSize: 14,
    fontWeight: "500",
  },
  scoreText: {
    color: "rgba(235,235,245,0.65)",
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 54,
    textAlign: "center",
  },
  dateText: {
    color: "rgba(235,235,245,0.65)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  scorePending: {
    color: "rgba(235,235,245,0.56)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  skeletonBlock: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 8,
  },
  skeletonHeader: {
    height: 18,
    width: "55%",
    marginBottom: 12,
  },
  skeletonLine: {
    height: 16,
    width: "85%",
    marginBottom: 8,
  },
  skeletonFooter: {
    height: 14,
    width: "40%",
  },
});
