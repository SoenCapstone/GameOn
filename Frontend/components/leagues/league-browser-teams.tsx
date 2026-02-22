import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueries } from "@tanstack/react-query";
import type { ImageSource } from "expo-image";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { teamDetailQueryOptions } from "@/hooks/use-team-detail";
import { InfoCard } from "@/components/info-card";
import { getSportLogo } from "@/components/browse/utils";

export type LeagueTeamResponse = {
  id: string;
  leagueId: string;
  teamId: string;
  joinedAt: string;
};

type Props = Readonly<{
  leagueId: string;
  leagueTeams: LeagueTeamResponse[];
  teamsFetching: boolean;
  leagueTeamsError: unknown;
}>;

type TeamDetail = Readonly<{
  id: string;
  name: string;
  sport: string | null;
  location: string | null;
  logoUrl: string | null;
}>;

export function LeagueBrowserTeams({
  leagueId,
  leagueTeams,
  teamsFetching,
  leagueTeamsError,
}: Props) {
  const api = useAxiosWithClerk();
  const router = useRouter();

  const teamIds = useMemo(
    () => Array.from(new Set(leagueTeams.map((team) => team.teamId))).filter(Boolean),
    [leagueTeams],
  );

  const teamQueries = useQueries({
    queries: teamIds.map((teamId) => teamDetailQueryOptions(api, teamId)),
  });

  const detailsFetching = teamQueries.some((query) => query.isFetching);
  const detailsError = teamQueries.find((query) => query.error)?.error;

  const teamDetailsMap = useMemo(() => {
    const entries: [string, TeamDetail][] = teamQueries.map((query, index) => {
      const teamId = teamIds[index] ?? "";
      const data = (query.data ?? null) as TeamDetail | null;

      if (!teamId) {
        return [
          "",
          { id: "", name: "Team", sport: null, location: null, logoUrl: null },
        ];
      }

      if (data) {
        return [teamId, data];
      }

      return [
        teamId,
        { id: teamId, name: "Team", sport: null, location: null, logoUrl: null },
      ];
    });

    return Object.fromEntries(entries.filter(([id]) => Boolean(id)));
  }, [teamQueries, teamIds]);

  const isBusy = teamsFetching || detailsFetching;

  if (leagueTeamsError || detailsError) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Teams</Text>
        <Text style={styles.text}>Failed to load league teams.</Text>
      </View>
    );
  }

  if (!isBusy && leagueTeams.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Teams</Text>
        <Text style={styles.text}>No teams in this league yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {isBusy ? <ActivityIndicator size="small" color="#fff" /> : null}

      <View style={styles.list}>
        {leagueTeams.map((team) => {
          const details = teamDetailsMap[team.teamId];
          const title = details?.name ?? "Team";

          const location = details?.location ?? "";
          const subtitle = location.trim() ? location : "Unknown location";

          const image: ImageSource = details?.logoUrl
            ? { uri: details.logoUrl }
            : getSportLogo(details?.sport);

          return (
            <InfoCard
              key={team.id}
              title={title}
              subtitle={subtitle}
              image={image}
              onPress={() => router.push(`/teams/${team.teamId}`)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 14, paddingBottom: 14 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  text: { color: "#fff", fontSize: 14 },

  wrap: { paddingTop: 14, paddingBottom: 14 },

  list: {
    gap: 16,
  },
});
