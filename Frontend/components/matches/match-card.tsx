import React, { useRef } from "react";
import {
  Alert,
  Pressable,
  Text,
  View,
  StyleSheet,
  findNodeHandle,
} from "react-native";
import { Image } from "expo-image";
import { getSportLogo } from "@/components/browse/utils";
import {
  formatMatchDateTime,
  isCancelledMatchStatus,
} from "@/features/matches/utils";
import { Card } from "@/components/ui/card";
import { useActionSheet } from "@expo/react-native-action-sheet";
import ContextMenu from "react-native-context-menu-view";
import { isRunningInExpoGo } from "@/utils/runtime";

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
  readonly canCancel?: boolean;
  readonly onConfirmCancel?: () => Promise<void>;
  readonly canSubmitScore?: boolean;
  readonly onSubmitScore?: () => void;
  readonly canOptOut?: boolean;
  readonly onOptOut?: () => void;
  readonly isReplacement?: boolean;
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
  homeScore,
  awayScore,
  onPress,
  canCancel = false,
  onConfirmCancel,
  canSubmitScore = false,
  onSubmitScore,
  canOptOut = false,
  onOptOut,
  isReplacement = false,
}: Readonly<MatchCardProps>) {
  const { showActionSheetWithOptions } = useActionSheet();
  const anchorRef = useRef<View>(null);
  const hasMenuActions =
    (canCancel && Boolean(onConfirmCancel)) ||
    (canSubmitScore && Boolean(onSubmitScore));

  const renderCenterValue = () => {
    if (isCancelledMatchStatus(status)) {
      return <Text style={styles.pending}>Cancelled</Text>;
    }

    const hasScore = homeScore != null && awayScore != null;
    if (hasScore) {
      return (
        <View style={styles.result}>
          <Text style={styles.score}>{homeScore}</Text>
          <Text style={styles.dash}>-</Text>
          <Text style={styles.score}>{awayScore}</Text>
        </View>
      );
    }

    return <Text style={styles.date}>{formatMatchDateTime(startTime)}</Text>;
  };

  const showCancelConfirm = () => {
    if (!onConfirmCancel) return;

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
  };

  const openMenu = () => {
    if (!hasMenuActions) return;

    const options = ["Cancel"];
    const cancelOptionIndex = 0;
    const actionByIndex = new Map<number, "cancel-match" | "match-score">();

    if (canSubmitScore && onSubmitScore) {
      options.push("Match Score");
      actionByIndex.set(options.length - 1, "match-score");
    }

    if (canCancel && onConfirmCancel) {
      options.push("Cancel Match");
      actionByIndex.set(options.length - 1, "cancel-match");
    }

    const cancelMatchIndex = options.indexOf("Cancel Match");

    if (isRunningInExpoGo) {
      showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex:
            cancelMatchIndex >= 0 ? cancelMatchIndex : undefined,
          cancelButtonIndex: cancelOptionIndex,
          anchor: findNodeHandle(anchorRef.current) ?? undefined,
        },
        (buttonIndex) => {
          const selectedAction =
            typeof buttonIndex === "number"
              ? actionByIndex.get(buttonIndex)
              : undefined;
          if (selectedAction === "cancel-match") {
            showCancelConfirm();
            return;
          }
          if (selectedAction === "match-score" && onSubmitScore) {
            onSubmitScore();
          }
        },
      );
    } else {
      showCancelConfirm();
    }
  };

  const cardContent = (
    <View>
      <Pressable
        ref={anchorRef}
        onPress={onPress}
        onLongPress={isRunningInExpoGo && hasMenuActions ? openMenu : undefined}
      >
        <Card isInteractive={!(hasMenuActions && !isRunningInExpoGo)}>
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
      <OptOutButton canOptOut={canOptOut} onOptOut={onOptOut} isReplacement={isReplacement} />
    </View>
  );

  if (!hasMenuActions) {
    return cardContent;
  }

  if (isRunningInExpoGo) {
    return cardContent;
  }

  const actions = [
    canSubmitScore && onSubmitScore
      ? {
          title: "Match Score",
          systemIcon: "rosette",
        }
      : null,
    canCancel && onConfirmCancel
      ? {
          title: "Cancel Match",
          systemIcon: "xmark",
          destructive: true,
        }
      : null,
  ].filter((action) => action !== null);

  return (
    <ContextMenu
      actions={actions}
      onPress={(e) => {
        if (e.nativeEvent.name === "Match Score" && onSubmitScore) {
          onSubmitScore();
          return;
        }
        if (e.nativeEvent.name === "Cancel Match") {
          openMenu();
        }
      }}
      previewBackgroundColor="transparent"
    >
      {cardContent}
    </ContextMenu>
  );
}

export function OptOutButton({
  canOptOut,
  onOptOut,
  isReplacement,
}: {
  readonly canOptOut: boolean;
  readonly onOptOut?: () => void;
  readonly isReplacement: boolean;
}) {
  if (!canOptOut || !onOptOut) return null;
  const label = isReplacement ? "Attending" : "Not attending";
  return (
    <Pressable onPress={onOptOut} style={styles.optOutButton}>
      <Text style={styles.optOutText}>{label}</Text>
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
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  dash: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 24,
    fontWeight: "400",
    marginHorizontal: 28,
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
  optOutButton: {
    alignSelf: "flex-end",
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  optOutText: {
    color: "rgba(235,235,245,0.6)",
    fontSize: 12,
    fontWeight: "500",
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
