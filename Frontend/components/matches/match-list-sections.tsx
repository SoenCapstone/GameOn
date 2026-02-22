import React from "react";
import { Pressable, Text, View } from "react-native";
import { MatchCard, MatchSkeletonCard } from "@/components/matches/match-card";
import { matchStyles } from "@/components/matches/match-styles";

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
  return (
    <View style={matchStyles.section}>
      <Text style={matchStyles.sectionTitle}>{title}</Text>
      <View style={matchStyles.sectionBody}>
        {isLoading ? (
          <>
            <MatchSkeletonCard />
            <MatchSkeletonCard />
          </>
        ) : items.length === 0 ? (
          <Text style={matchStyles.emptyText}>{emptyText}</Text>
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
              onPress={() => onMatchPress(match.id)}
            />
          ))
        )}
      </View>
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
        <View style={matchStyles.section}>
          <Text style={matchStyles.emptyText}>{errorText}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} style={matchStyles.retryButton}>
              <Text style={matchStyles.retryText}>Retry</Text>
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
