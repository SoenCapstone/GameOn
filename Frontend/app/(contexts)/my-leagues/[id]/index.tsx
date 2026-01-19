import React from "react";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { useLeagueHeader } from "@/hooks/use-team-league-header";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";

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
  const { id, isLoading, refreshing, onRefresh, handleFollow, title, isOwner } =
    useLeagueDetailContext();

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
    </ContentArea>
  );
}
