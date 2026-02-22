import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { ContentArea } from "@/components/ui/content-area";
import { LeagueBrowserTeams } from "@/components/leagues/league-browser-teams";
import { useLeagueHeader } from "@/hooks/use-team-league-header";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";

type LeagueTab = "board" | "standings" | "teams";


const LEAGUE_TABS: readonly LeagueTab[] = ["board", "standings", "teams"] as const;

const TAB_LABELS: Record<LeagueTab, string> = {
  board: "Board",
  standings: "Standings",
  teams: "Teams",
};

export default function LeagueScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  return (
    <LeagueDetailProvider id={id}>
      <LeagueContent />
    </LeagueDetailProvider>
  );
}

function LeagueContent() {
  const [tab, setTab] = useState<LeagueTab>("board");
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


    leagueTeams,
    isLeagueTeamsLoading,
    leagueTeamsError,
  } = useLeagueDetailContext();

  const log = createScopedLog("League Page");

  useLeagueHeader({ title, id, isMember, isOwner, onFollow: handleFollow });

  const selectedIndex = useMemo(() => LEAGUE_TABS.indexOf(tab), [tab]);

  const handleTabChange = useCallback(
    (index: number) => {
      const nextTab = LEAGUE_TABS[index] ?? "board";
      setTab(nextTab);
      log.info("Tab changed", { tab: nextTab });
    },
    [log],
  );

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
        values={LEAGUE_TABS.map((t) => TAB_LABELS[t])}
        selectedIndex={selectedIndex}
        onChange={(event) => {
          handleTabChange(event.nativeEvent.selectedSegmentIndex);
        }}
        style={{ height: 40 }}
      />

      {isLoading && (
        <View style={styles.container}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}

      {!isLoading && (
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

          {tab === "teams" && (
            <LeagueBrowserTeams
              leagueId={id}
              leagueTeams={leagueTeams ?? []}
              teamsFetching={Boolean(isLeagueTeamsLoading)}
              leagueTeamsError={leagueTeamsError}
            />
          )}
        </>
      )}
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: "center",
  },
  section: {
    paddingTop: 14,
    paddingBottom: 14,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.95,
  },
  muted: {
    color: "#fff",
    opacity: 0.75,
    marginTop: 8,
  },
});