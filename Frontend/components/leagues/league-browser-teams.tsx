import React, { useMemo } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueries } from "@tanstack/react-query";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import {
  teamDetailQueryOptions,
  type TeamDetailResponse,
} from "@/hooks/use-team-detail";
import { Card } from "@/components/ui/card";

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
              onPress={() => router.push(`/teams/${t.teamId}`)}
            >
              <Card>
                <View style={styles.cardContent}>
                  {logoUrl ? (
                    <Image source={{ uri: logoUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarText}>
                        {initials || "T"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.textWrap}>
                    <Text style={styles.cardTitle}>{name}</Text>
                    {!!subtitle && (
                      <Text style={styles.cardSubtitle}>{subtitle}</Text>
                    )}
                  </View>
                </View>
              </Card>
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

  wrap: { paddingTop: 14, paddingBottom: 14 },

  list: {
    gap: 16,
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  textWrap: {
    flex: 1,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  cardSubtitle: {
    color: "#fff",
    opacity: 0.8,
    marginTop: 4,
    fontSize: 14,
  },
});