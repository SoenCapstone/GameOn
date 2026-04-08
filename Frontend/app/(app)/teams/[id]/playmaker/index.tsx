import { RefreshControl } from "react-native";
import { useMemo } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { useTeamPlays } from "@/hooks/use-team-plays";
import { PlayMakerPlayList } from "@/components/play-maker/play-maker-play-list";

export default function PlayMaker() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const teamId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  return (
    <TeamDetailProvider id={teamId}>
      <PlayMakerListContent />
    </TeamDetailProvider>
  );
}

function PlayMakerListContent() {
  const { refreshing, onRefresh, id: teamId } = useTeamDetailContext();
  const router = useRouter();

  const { data: playsData, isLoading: playsLoading } = useTeamPlays(teamId);
  const plays = useMemo(() => {
    if (Array.isArray(playsData)) {
      return playsData.filter(
        (play): play is string => typeof play === "string",
      );
    }
    return [];
  }, [playsData]);

  return (
    <>
      <Stack.Screen.Title>Playmaker</Stack.Screen.Title>
      <ContentArea
        background={{ preset: "red" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        toolbar={
          <Stack.Toolbar placement="bottom">
            <Stack.Toolbar.Button
              onPress={() => router.push(`/teams/${teamId}/playmaker/create`)}
            >
              Create Play
            </Stack.Toolbar.Button>
          </Stack.Toolbar>
        }
      >
        <PlayMakerPlayList teamId={teamId} plays={playsLoading ? [] : plays} />
      </ContentArea>
    </>
  );
}
