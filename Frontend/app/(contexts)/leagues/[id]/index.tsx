import React, { useState, useCallback } from "react";
import { ActivityIndicator, RefreshControl, Text, View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useLeagueHeader } from "@/hooks/use-team-league-header";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";

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
        values={["Board", "Standings", "Browser"]}
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
              <Text style={styles.muted}>
                League: {league?.name ?? title}
              </Text>
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

          {tab === "browser" && (
            <View style={styles.section}>
              <Text style={styles.title}>Browser</Text>
              <Text style={styles.text}>
                Browse teams in this league (cards/grid).
              </Text>
            </View>
          )}
        </>
      )}
    </ContentArea>
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
});
