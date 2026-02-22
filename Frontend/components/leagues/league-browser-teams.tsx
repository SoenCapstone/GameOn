import React, { useMemo } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueries } from "@tanstack/react-query";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import {
  teamDetailQueryOptions,
  type TeamDetailResponse,
} from "@/hooks/use-team-detail";

export type LeagueTeamResponse = {
  id: string;
  leagueId: string;
  teamId: string;
  joinedAt: string;
};

type Props = {
  leagueId: string;
  leagueTeams: LeagueTeamResponse[];
  teamsFetching: boolean;
  leagueTeamsError: unknown;
};

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
    queries: teamIds.map((teamId) => teamDetailQueryOptions(api, teamId)),
  });

  const detailsFetching = teamQueries.some((q) => q.isFetching);
  const detailsError = teamQueries.find((q) => q.error)?.error;

  const teamDetailsMap = useMemo(() => {
    const entries: [string, TeamDetailResponse][] = teamQueries.map((q, idx) => {
      const teamId = teamIds[idx] ?? "";
      if (!teamId) {
        return [
          "",
          { id: "", name: "Team", sport: null, location: null, logoUrl: null },
        ];
      }

      if (q.data) return [teamId, q.data];


      return [
        teamId,
        { id: teamId, name: "Team", sport: null, location: null, logoUrl: null },
      ];
    });

    return Object.fromEntries(entries.filter(([k]) => Boolean(k)));
  }, [teamQueries, teamIds]);

  const isBusy = teamsFetching || detailsFetching;

  if (leagueTeamsError || detailsError) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Browse</Text>
        <Text style={styles.text}>Failed to load league teams.</Text>
      </View>
    );
  }

  if (!isBusy && leagueTeams.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Browse</Text>
        <Text style={styles.text}>No teams in this league yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.browserWrap}>
      {isBusy && <ActivityIndicator size="small" color="#fff" />}

      <View style={styles.browserGrid}>
        {leagueTeams.map((t) => {
          const details = teamDetailsMap?.[t.teamId];
          const name = details?.name ?? "Team";
          const subtitle = details?.sport ?? details?.location ?? "";
          const logoUrl = details?.logoUrl ?? null;

          const initials = name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => (w[0] ? w[0].toUpperCase() : ""))
            .join("");

          return (
            <Pressable
              key={t.id}
              style={styles.browserCard}
              onPress={() => router.push(`/teams/${t.teamId}`)}
            >
              <View style={styles.cardContent}>
                {logoUrl ? (
                  <Image source={{ uri: logoUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {initials || "T"}
                    </Text>
                  </View>
                )}

                <Text style={styles.cardTitle} numberOfLines={2}>
                  {name}
                </Text>

                {!!subtitle && (
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>
            </Pressable>
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

  browserWrap: { paddingTop: 14, paddingBottom: 14 },

  browserGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  browserCard: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },

  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 14,
  },

  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarFallbackText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  cardSubtitle: {
    color: "#fff",
    opacity: 0.8,
    marginTop: 4,
    fontSize: 14,
    textAlign: "center",
  },
});