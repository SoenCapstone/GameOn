import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { useLeagueHeader } from "@/hooks/use-team-league-header";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import { styles } from "./league.styles";
import { GlassView } from "expo-glass-effect";

type Tab = "Overview" | "Games" | "Teams";

const PLACEHOLDER_ROWS = Array.from({ length: 14 }).map((_, i) => ({
  id: `placeholder-${i}`,
}));

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
  const { id, isLoading, refreshing, onRefresh, handleFollow, title, isOwner } =
    useLeagueDetailContext();
  const [tab, setTab] = useState<Tab>("Overview");

  const tabs = useMemo(() => ["Overview", "Games", "Teams"] as Tab[], []);

  useLeagueHeader({ title, id, isOwner, onFollow: handleFollow });

  return (
    <ContentArea
      scrollable
      paddingBottom={60}
      backgroundProps={{ preset: "red" }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
        />
      }
    >
      {isLoading ? <ActivityIndicator size="small" color="#fff" /> : null}

        {/* Tabs (same page, no routing) */}
        <GlassView glassEffectStyle="regular" style={styles.tabsGlass}>
          {tabs.map((t, idx) => {
            const active = t === tab;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[
                  styles.tabBtn,
                  active && styles.tabBtnActive,
                  idx === 1 && styles.tabMiddle,
                ]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </GlassView>

        {/* Content switches below */}
        {tab === "Overview" && (
          <>
            <GlassView glassEffectStyle="regular" style={styles.tableHeaderGlass}>
              <Text style={styles.hRank}>#</Text>
              <Text style={styles.hTeam}>Team</Text>
              <Text style={styles.hStat}>P</Text>
              <Text style={styles.hStat}>W</Text>
              <Text style={styles.hStat}>D</Text>
              <Text style={styles.hStat}>L</Text>
              <Text style={styles.hGD}>GD</Text>
              <Text style={styles.hPts}>Pts</Text>
            </GlassView>

            <FlatList
              data={PLACEHOLDER_ROWS}
              keyExtractor={(x) => x.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ index }) => (
                <View style={styles.row}>
                  <View style={styles.rankPill}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>

                  <View style={styles.teamCell}>
                    <View style={styles.teamBadge}>
                      <Text style={styles.teamBadgeText}>--</Text>
                    </View>

                    <View style={styles.teamNameWrap}>
                      <View style={styles.skelName} />
                    </View>
                  </View>

                  <View style={styles.statsCell}>
                    <View style={styles.skelNum} />
                  </View>
                  <View style={styles.statsCell}>
                    <View style={styles.skelNum} />
                  </View>
                  <View style={styles.statsCell}>
                    <View style={styles.skelNum} />
                  </View>
                  <View style={styles.statsCell}>
                    <View style={styles.skelNum} />
                  </View>

                  <View style={styles.gdCell}>
                    <View style={styles.skelNumSmall} />
                  </View>

                  <View style={styles.ptsCell}>
                    <View style={styles.skelNumSmall} />
                  </View>
                </View>
              )}
            />
          </>
        )}

        {tab === "Games" && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Games</Text>
            <Text style={styles.emptySubtitle}>Coming soon</Text>
          </View>
        )}

        {tab === "Teams" && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Teams</Text>
            <Text style={styles.emptySubtitle}>Coming soon</Text>
          </View>
        )}
    </ContentArea>
  );
}
