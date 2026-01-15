import React from "react";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { useTeamHeader } from "@/hooks/use-team-header";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
// import { StyleSheet } from "react-native";
// import { PlayMakerArea } from "@/components/play-maker/play-maker-area";

export default function MyTeamScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  return (
    <TeamDetailProvider id={id}>
      <MyTeamContent />
    </TeamDetailProvider>
  );
}

function MyTeamContent() {
  const { id, isLoading, refreshing, onRefresh, handleFollow, title, isOwner } =
    useTeamDetailContext();

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
      {/* <PlayMakerArea styles={styles} /> */}
      {isLoading ? <ActivityIndicator size="small" color="#fff" /> : null}
    </ContentArea>
  );
}

/* Example of how to use the PlayMakerArea component */

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   hint: {
//     color: "white",
//     opacity: 0.85,
//     paddingTop: 10,
//     paddingBottom: 8,
//   },
//   boardWrapper: { height: "50%" },
//   shapeArea: {
//     height: "7%",
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   panelArea: { height: "34%" },
// });
