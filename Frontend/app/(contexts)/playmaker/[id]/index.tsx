import { useCallback, useLayoutEffect, useRef } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native";
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
import type { Shape } from "@/components/play-maker/model";
import { useMutation } from "@tanstack/react-query";

import {
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";

function toBackendPayload(shapes: Shape[]) {
  return shapes
    .filter((s): s is Exclude<Shape, { type: "select" }> => s.type !== "select")
    .map((s) => {
      if (s.type === "arrow") {
        return {
          type: "arrow",
          id: s.id,
          from: s.from,
          to: s.to,
        };
      }

      return {
        type: "person",
        id: s.id,
        x: s.x,
        y: s.y,
        size: s.size,
        ...(s.associatedPlayerId
          ? { associatedPlayerId: s.associatedPlayerId }
          : {}),
      };
    });
}

type PlaymakerHeaderProps = Readonly<{
  title: string;
  saving: boolean;
  onSave: () => void;
}>;

function PlaymakerHeader({ title, saving, onSave }: PlaymakerHeaderProps) {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title={title} subtitle="Playmaker" />}
      right={
        <Button
          isInteractive
          type="custom"
          label="Save"
          onPress={onSave}
          loading={saving}
        />
      }
    />
  );
}

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

function PlayMakerContent() {
  const {
    isLoading,
    refreshing,
    onRefresh,
    title,
    id: teamId,
  } = useTeamDetailContext();

  const navigation = useNavigation();

  const savePlayMutation = useMutation({
    mutationFn: async (shapes: Shape[]) => {
      const payload = toBackendPayload(shapes);
      const route = GO_TEAM_SERVICE_ROUTES.CREATE_PLAY(teamId);
      return api.post(route, payload);
    },
    onSuccess: () => {
      Alert.alert("Saved", "Your play was saved successfully.");
    },
    onError: (err) => {
      Alert.alert("Error while saving play:", errorToString(err));
    },
  });
  const api = useAxiosWithClerk();

  const latestShapesRef = useRef<Shape[]>([]);

  const handleShapesChange = useCallback((shapes: Shape[]) => {
    latestShapesRef.current = shapes;
  }, []);

  const onSave = useCallback(async () => {
    const shapes = latestShapesRef.current;

    if (!shapes || shapes.length === 0) {
      Alert.alert("Nothing to save", "Add some shapes on the board first.");
      return;
    }

    savePlayMutation.mutate(shapes);
  }, [savePlayMutation]);

  const headerTitle = useCallback(
    () => (
      <PlaymakerHeader
        title={title}
        saving={savePlayMutation.isPending}
        onSave={onSave}
      />
    ),
    [title, savePlayMutation.isPending, onSave],
  );

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle });
  }, [navigation, headerTitle]);

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
      <PlayMakerArea styles={styles} onShapesChange={handleShapesChange} />
      {isLoading ? <ActivityIndicator size="small" color="#fff" /> : null}
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  boardWrapper: { height: "50%" },
  shapeArea: {
    height: "7%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  panelArea: { height: "43%" },
});
