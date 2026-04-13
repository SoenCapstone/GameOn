import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { MatchCard } from "@/components/matches/match-card";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";

type MatchItem = {
  id: string;
  leagueId?: string;
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
  onMatchPress,
}: {
  readonly title: string;
  readonly items: MatchItem[];
  readonly onMatchPress: (match: MatchItem) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>
        {items.map((match) => (
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
            onPress={() => onMatchPress(match)}
          />
        ))}
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
  const hasMatches = today.length > 0 || upcoming.length > 0 || past.length > 0;

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

      {!errorText && isLoading ? <Loading /> : null}

      {!errorText && !isLoading && !hasMatches ? (
        <Empty message="No matches available" />
      ) : null}

      {!isLoading && today.length > 0 ? (
        <ListSection
          title="Today"
          items={today}
          onMatchPress={onMatchPress}
        />
      ) : null}

      {!isLoading && upcoming.length > 0 ? (
        <ListSection
          title="Upcoming"
          items={upcoming}
          onMatchPress={onMatchPress}
        />
      ) : null}

      {!isLoading && past.length > 0 ? (
        <ListSection
          title="Past"
          items={past}
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
