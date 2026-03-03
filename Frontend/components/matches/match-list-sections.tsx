import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { MatchCard, MatchSkeletonCard } from "@/components/matches/match-card";

type MatchItem = {
  id: string;
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
};

interface MatchListSectionsProps {
  readonly current: MatchItem[];
  readonly upcoming: MatchItem[];
  readonly past: MatchItem[];
  readonly isLoading: boolean;
  readonly errorText?: string | null;
  readonly onRetry?: () => void;
  readonly onMatchPress: (matchId: string) => void;
}

function ListSection({
  title,
  emptyText,
  items,
  isLoading,
  onMatchPress,
}: {
  readonly title: string;
  readonly emptyText: string;
  readonly items: MatchItem[];
  readonly isLoading: boolean;
  readonly onMatchPress: (matchId: string) => void;
}) {
  const renderSectionContent = () => {
    if (isLoading) {
      return (
        <>
          <MatchSkeletonCard />
          <MatchSkeletonCard />
        </>
      );
    }

    if (items.length === 0) {
      return <Text style={styles.emptyText}>{emptyText}</Text>;
    }

    return items.map((match) => (
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
        onPress={() => onMatchPress(match.id)}
      />
    ));
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{renderSectionContent()}</View>
    </View>
  );
}

export function MatchListSections({
  current,
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

      <ListSection
        title="Current"
        emptyText="No current matches"
        items={current}
        isLoading={isLoading}
        onMatchPress={onMatchPress}
      />

      <ListSection
        title="Upcoming"
        emptyText="No upcoming matches"
        items={upcoming}
        isLoading={isLoading}
        onMatchPress={onMatchPress}
      />

      <ListSection
        title="Past"
        emptyText="No past matches"
        items={past}
        isLoading={isLoading}
        onMatchPress={onMatchPress}
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  sectionBody: {
    gap: 10,
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
