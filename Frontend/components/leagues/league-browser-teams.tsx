import React, { useMemo } from "react";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useQueries } from "@tanstack/react-query";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import {
  teamDetailQueryOptions,
  type TeamDetailResponse,
} from "@/hooks/use-team-detail";
import { InfoCard } from "@/components/info-card";
import type { ImageSource } from "expo-image";
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

export function LeagueBrowserTeams({
  leagueId,
  leagueTeams,
  teamsFetching,
  leagueTeamsError,
}: Props) {
  const api = useAxiosWithClerk();
  const router = useRouter();

  const teamIds = useMemo(
    () => Array.from(new Set(leagueTeams.map((t) => t.teamId))).filter(Boolean),
    [leagueTeams],
  );

  const teamQueries = useQueries({
    queries: teamIds.map((teamId) =>
      teamDetailQueryOptions(api, teamId),
    ),
  });

  const detailsFetching = teamQueries.some((q) => q.isFetching);
  const detailsError = teamQueries.find((q) => q.error)?.error;

  const teamDetailsMap = useMemo(() => {
    const entries: [string, TeamDetailResponse][] = teamQueries.map(
      (q, idx) => {
        const teamId = teamIds[idx] ?? "";
        const data = q.data ?? null;

        if (!teamId) {
          return [
            "",
            {
              id: "",
              name: "Team",
              sport: null,
              location: null,
              logoUrl: null,
            },
          ];
        }

        if (data) return [teamId, data];

        return [
          teamId,
          {
            id: teamId,
            name: "Team",
            sport: null,
            location: null,
            logoUrl: null,
          },
        ];
      },
    );

    return Object.fromEntries(entries.filter(([k]) => Boolean(k)));
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
      {isBusy && <ActivityIndicator size="small" color="#fff" />}

      <View style={styles.list}>
        {leagueTeams.map((t) => {
          const details = teamDetailsMap?.[t.teamId];
          const title = details?.name ?? "Team";

          const location = details?.location ?? "";
          const subtitle =
            location.trim().length > 0 ? location : "Unknown location";

          const image: ImageSource = details?.logoUrl
            ? { uri: details.logoUrl }
            : getSportLogo(details?.sport);

          return (
            <InfoCard
              key={t.id}
              title={title}
              subtitle={subtitle}
              image={image}
              onPress={() => router.push(`/teams/${t.teamId}`)}
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