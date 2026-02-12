import React, { useLayoutEffect } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { PlayMakerArea } from "@/components/play-maker/play-maker-area";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";

export default function PlayMaker() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  return (
    <TeamDetailProvider id={id}>
      <PlayMakerContent />
    </TeamDetailProvider>
  );
}

function renderPlaymakerHeader(title: string) {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title={`${title} Playmaker`} />}
    />
  );
}

function PlayMakerContent() {
  // More attributes regarding team and membership can be taken from the context,
  // they were excluded as they are currently unused
  const { isLoading, refreshing, onRefresh, title } = useTeamDetailContext();

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => renderPlaymakerHeader(title),
    });
  }, [navigation, title]);

  return (
    <ContentArea
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
      <PlayMakerArea styles={styles} />
      {isLoading ? <ActivityIndicator size="small" color="#fff" /> : null}
    </ContentArea>
  );
}

/* Example of how to use the PlayMakerArea component */

const styles = StyleSheet.create({
  container: { flex: 1 },
  hint: {
    color: "white",
    opacity: 0.85,
    paddingTop: 10,
    paddingBottom: 8,
  },
  boardWrapper: { height: "50%" },
  shapeArea: {
    height: "7%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  panelArea: { height: "43%" },
});
