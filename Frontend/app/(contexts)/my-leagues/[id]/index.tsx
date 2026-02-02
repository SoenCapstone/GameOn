import React, { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { useLeagueHeader } from "@/hooks/use-team-league-header";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import { styles } from "@/components/leagues/league.styles";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { createTeamStyles } from "@/components/teams/teams-styles";

export default function MyLeagueScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  return (
    <LeagueDetailProvider id={id}>
      <MyLeagueContent />
    </LeagueDetailProvider>
  );
}

function MyLeagueContent() {
  const { id, isLoading, handleFollow, title, isMember } =
    useLeagueDetailContext();

  const [tab, setTab] = useState<"overview" | "games" | "teams">("overview");

  useLeagueHeader({ title, id, isMember, onFollow: handleFollow });

  return (
    <ContentArea paddingBottom={60} backgroundProps={{ preset: "red" }}>
      {isLoading ? <ActivityIndicator size="small" color="#fff" /> : null}
      <View style={createTeamStyles.container}>
        {/* Tabs (same page, no routing) */}
        <SegmentedControl
          values={["Overview", "Games", "Teams"]}
          selectedIndex={tab === "overview" ? 0 : tab === "games" ? 1 : 2}
          onValueChange={(value) => {
            if (value === "Overview") setTab("overview");
            if (value === "Games") setTab("games");
            if (value === "Teams") setTab("teams");
          }}
          style={{ marginBottom: 12, width: "90%" }}
        />

        {/* Content switches below */}
        {tab === "overview" && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Overview</Text>
            <Text style={styles.emptySubtitle}>Coming soon</Text>
          </View>
        )}

        {tab === "games" && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Games</Text>
            <Text style={styles.emptySubtitle}>Coming soon</Text>
          </View>
        )}

        {tab === "teams" && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Teams</Text>
            <Text style={styles.emptySubtitle}>Coming soon</Text>
          </View>
        )}
      </View>
    </ContentArea>
  );
}
