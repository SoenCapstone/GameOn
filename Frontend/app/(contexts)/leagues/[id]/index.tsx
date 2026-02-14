import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  Text,
  View,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useQuery } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { useLeagueHeader } from "@/hooks/use-team-league-header";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";

type LeagueTeamResponse = {
  id: string;
  leagueId: string;
  teamId: string;
  joinedAt: string;
};

type TeamDetailResponse = {
  id: string;
  name: string;
  sport?: string | null;
  location?: string | null;
  logoUrl?: string | null;
};

export default function LeagueScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  return (
    <LeagueDetailProvider id={id}>
      <LeagueContent />
    </LeagueDetailProvider>
  );
}

function LeagueContent() {
  const [tab, setTab] = useState<"board" | "standings" | "browser">("board");
  const [refreshingLocal, setRefreshingLocal] = useState(false);

  const {
    id,
    isLoading,
    refreshing,
    onRefresh,
    handleFollow,
    title,
    isMember,
    isOwner,
    league,
  } = useLeagueDetailContext();

  const log = createScopedLog("League Page");

  useLeagueHeader({ title, id, isMember, isOwner, onFollow: handleFollow });

  const getTabFromSegmentValue = (
    value: string,
  ): "board" | "standings" | "browser" => {
    if (value === "Board") return "board";
    if (value === "Standings") return "standings";
    return "browser";
  };

  const getSelectedIndex = (): number => {
    if (tab === "board") return 0;
    if (tab === "standings") return 1;
    return 2;
  };

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshingLocal(true);
      await onRefresh();
      log.info("League refreshed", { tab });
    } catch (err) {
      log.error("League refresh failed", { tab, error: errorToString(err) });
    } finally {
      setRefreshingLocal(false);
    }
  }, [log, onRefresh, tab]);

  return (
    <ContentArea
      scrollable
      paddingBottom={60}
      segmentedControl
      backgroundProps={{ preset: "red" }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || refreshingLocal}
          onRefresh={handleRefresh}
          tintColor="#fff"
        />
      }
    >
      <SegmentedControl
        values={["Board", "Standings", "Browse"]}
        selectedIndex={getSelectedIndex()}
        onValueChange={(value) => {
          const newTab = getTabFromSegmentValue(value);
          setTab(newTab);
          log.info("Tab changed", { tab: newTab });
        }}
        style={{ height: 40 }}
      />

      {isLoading ? (
        <View style={styles.container}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : (
        <>
          {(refreshing || refreshingLocal) && (
            <ActivityIndicator size="small" color="#fff" />
          )}

          {tab === "board" && (
            <View style={styles.section}>
              <Text style={styles.title}>Board</Text>
              <Text style={styles.text}>
                League board content here (posts / announcements).
              </Text>
              <Text style={styles.muted}>League: {league?.name ?? title}</Text>
            </View>
          )}

          {tab === "standings" && (
            <View style={styles.section}>
              <Text style={styles.title}>Standings</Text>
              <Text style={styles.text}>
                Standings table goes here (rank / points / W-D-L).
              </Text>
            </View>
          )}

          {tab === "browser" && <LeagueBrowserTeams leagueId={id} />}
        </>
      )}
    </ContentArea>
  );
}

function LeagueBrowserTeams({ leagueId }: { leagueId: string }) {
  const api = useAxiosWithClerk();
  const router = useRouter();

  const {
    data: leagueTeams = [],
    isFetching: teamsFetching,
    error: leagueTeamsError,
  } = useQuery<LeagueTeamResponse[]>({
    queryKey: ["league-teams", leagueId],
    queryFn: async () => {
      const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.TEAMS(leagueId));
      return resp.data ?? [];
    },
    enabled: Boolean(leagueId),
  });

  const teamIdsKey = useMemo(
    () => leagueTeams.map((t) => t.teamId).join(","),
    [leagueTeams],
  );

  const {
    data: teamDetailsMap,
    isFetching: detailsFetching,
    error: detailsError,
  } = useQuery<Record<string, TeamDetailResponse>>({
    queryKey: ["league-team-details", leagueId, teamIdsKey],
    queryFn: async () => {
      const entries = await Promise.all(
        leagueTeams.map(async (t) => {
          try {
            const resp = await api.get(
              `${GO_TEAM_SERVICE_ROUTES.ALL}/${t.teamId}`,
            );
            return [t.teamId, resp.data] as const;
          } catch {
            return [
              t.teamId,
              {
                id: t.teamId,
                name: "Team",
                sport: null,
                location: null,
                logoUrl: null,
              },
            ] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: leagueTeams.length > 0,
  });

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
          const sportOrLoc = details?.sport ?? details?.location ?? "";
          const logoUrl = details?.logoUrl ?? null;

          const initials = name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("");

          return (
            <Pressable
              key={t.id}
              style={styles.browserCard}
              onPress={() => router.push(`/teams/${t.teamId}`)}
            >
              {logoUrl ? (
                <Image
                  source={{ uri: logoUrl }}
                  style={styles.browserAvatarImage}
                />
              ) : (
                <View style={styles.browserAvatar}>
                  <Text style={styles.browserAvatarText}>{initials || "T"}</Text>
                </View>
              )}

              <Text style={styles.browserName} numberOfLines={1}>
                {name}
              </Text>

              {sportOrLoc ? (
                <Text style={styles.browserSub} numberOfLines={1}>
                  {sportOrLoc}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  section: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  text: {
    color: "white",
    opacity: 0.9,
  },
  muted: {
    color: "white",
    opacity: 0.6,
  },

  browserWrap: {
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  browserGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  browserCard: {
    width: "47%",
    minHeight: 150,
    borderRadius: 26,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  browserAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  browserAvatarText: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
  },
  browserAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 10,
  },
  browserName: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  browserSub: {
    marginTop: 4,
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    textAlign: "center",
  },
});
