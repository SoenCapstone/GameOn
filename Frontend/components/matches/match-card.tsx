import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { getSportLogo } from "@/components/browse/utils";
import { formatMatchDateTime } from "@/features/matches/utils";
import { matchStyles } from "@/components/matches/match-styles";

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
      return <Text style={matchStyles.dateText}>{formatMatchDateTime(startTime)}</Text>;
    }

    const hasScore = homeScore !== undefined && awayScore !== undefined;
    if (hasScore) {
      return (
        <Text style={matchStyles.scoreText}>
          {homeScore} - {awayScore}
        </Text>
      );
    }

    return <Text style={matchStyles.scorePending}>Score unavailable</Text>;
  };

  return (
    <Pressable onPress={onPress} style={matchStyles.cardPressable}>
      <View style={matchStyles.cardSurface}>
        <View style={matchStyles.card}>
          <View style={matchStyles.contentRow}>
            <View style={matchStyles.sideColumn}>
              <Image
                source={homeLogoUrl ? { uri: homeLogoUrl } : getSportLogo(sport)}
                style={matchStyles.teamLogo}
                contentFit="contain"
              />
              <Text style={matchStyles.teamName} numberOfLines={1}>
                {homeName}
              </Text>
            </View>

            <View style={matchStyles.centerColumn}>
              <Text style={matchStyles.contextLabel} numberOfLines={1}>
                {contextLabel}
              </Text>
              {renderCenterValue()}
            </View>

            <View style={matchStyles.sideColumn}>
              <Image
                source={awayLogoUrl ? { uri: awayLogoUrl } : getSportLogo(sport)}
                style={matchStyles.teamLogo}
                contentFit="contain"
              />
              <Text style={matchStyles.teamName} numberOfLines={1}>
                {awayName}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function MatchSkeletonCard() {
  return (
    <View style={matchStyles.cardSurface}>
      <View>
        <View style={[matchStyles.skeletonBlock, matchStyles.skeletonHeader]} />
        <View style={[matchStyles.skeletonBlock, matchStyles.skeletonLine]} />
        <View style={[matchStyles.skeletonBlock, matchStyles.skeletonLine]} />
        <View style={[matchStyles.skeletonBlock, matchStyles.skeletonFooter]} />
      </View>
    </View>
  );
}
