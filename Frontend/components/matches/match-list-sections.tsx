import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { MatchCard, MatchSkeletonCard } from "@/components/matches/match-card";

type MatchItem = {
  id: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeName: string;
  awayName: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  sport?: string | null;
  contextLabel: string;
  status: string;
  startTime: string;
  isPast: boolean;
  homeScore?: number | null;
  awayScore?: number | null;
  canCancel?: boolean;
  onConfirmCancel?: () => Promise<void>;
  canSubmitScore?: boolean;
  onSubmitScore?: () => void;
  canOptOut?: boolean;
  onOptOut?: () => void;
};

interface MatchListSectionsProps {
  readonly today: MatchItem[];
  readonly upcoming: MatchItem[];
  readonly past: MatchItem[];
  readonly isLoading: boolean;
  readonly errorText?: string | null;
  readonly onRetry?: () => void;
  readonly onMatchPress: (match: MatchItem) => void;
}

function ListSection({
  title,
  items,
  isLoading,
  onMatchPress,
}: {
  readonly title: string;
  readonly items: MatchItem[];
  readonly isLoading: boolean;
  readonly onMatchPress: (match: MatchItem) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>
        {isLoading ? (
          <>
            <MatchSkeletonCard />
            <MatchSkeletonCard />
          </>
        ) : (
          items.map((match) => (
            <MatchCard
              key={match.id}
              homeName={match.homeName}
              awayName={match.awayName}
              homeLogoUrl={match.homeLogoUrl}
              awayLogoUrl={match.awayLogoUrl}
              sport={match.sport}
              contextLabel={match.contextLabel}
              status={match.status}
              startTime={match.startTime}
              isPast={match.isPast}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              canCancel={Boolean(match.canCancel)}
              onConfirmCancel={match.onConfirmCancel}
              canSubmitScore={Boolean(match.canSubmitScore)}
              onSubmitScore={match.onSubmitScore}
              canOptOut={Boolean(match.canOptOut)}
              onOptOut={match.onOptOut}
              onPress={() => onMatchPress(match)}
            />
          ))
        )}
      </View>
    </View>
  );
}

export function MatchListSections({
  today,
  upcoming,
  past,
  isLoading,
  errorText,
  onRetry,
  onMatchPress,
}: Readonly<MatchListSectionsProps>) {
  return (
    <>
      {errorText ? (
        <View style={styles.section}>
          <Text style={styles.emptyText}>{errorText}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {isLoading || today.length > 0 ? (
        <ListSection
          title="Today"
          items={today}
          isLoading={isLoading}
          onMatchPress={onMatchPress}
        />
      ) : null}

      {isLoading || upcoming.length > 0 ? (
        <ListSection
          title="Upcoming"
          items={upcoming}
          isLoading={isLoading}
          onMatchPress={onMatchPress}
        />
      ) : null}

      {isLoading || past.length > 0 ? (
        <ListSection
          title="Past"
          items={past}
          isLoading={isLoading}
          onMatchPress={onMatchPress}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 6,
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "600",
    paddingTop: 5,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  sectionBody: {
    gap: 14,
  },
  emptyText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
  },
  retryButton: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  retryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
