import React from "react";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { useTeamDetail } from "@/hooks/use-team-detail";
import { useTeamHeader } from "@/hooks/use-team-header";

export default function TeamDetailById() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  const { isLoading, refreshing, onRefresh, handleFollow, title, isOwner } =
    useTeamDetail(id);

  useTeamHeader({ title, id, isOwner, onFollow: handleFollow });

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
