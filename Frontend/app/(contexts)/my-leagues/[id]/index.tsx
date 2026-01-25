import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useLocalSearchParams } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { useLeagueHeader } from "@/hooks/use-team-league-header";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import { styles } from "@/components/leagues/league.styles";
import { GlassView } from "expo-glass-effect";

type Tab = "Overview" | "Games" | "Teams";


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
  const { id, isLoading, handleFollow, title, isOwner } =
    useLeagueDetailContext();


  const [tab, setTab] = useState<Tab>("Overview");
  
  const tabs = useMemo(() => ["Overview", "Games", "Teams"] as Tab[], []);

  useLeagueHeader({ title, id, isOwner, onFollow: handleFollow });

  return (
    <ContentArea
      paddingBottom={60}
      backgroundProps={{ preset: "red" }}
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
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyTitle}>Overview</Text>
                  <Text style={styles.emptySubtitle}>Coming soon</Text>
                </View>
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
