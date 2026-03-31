import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  View,
  Text,
  Pressable,
  ScrollView,
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

import { useTeamPlays } from "@/hooks/use-team-plays";
import { usePlayDetails } from "@/hooks/use-play-details";

// ── helpers ─────────────────────────────────────────────────────

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

function fromBackendPayload(items: any[]): Shape[] {
  return items.map((item) => {
    if (item.type === "arrow") {
      return {
        type: "arrow" as const,
        id: item.id,
        from: item.from,
        to: item.to,
      };
    }

    return {
      type: "person" as const,
      id: item.id,
      x: item.x,
      y: item.y,
      size: item.size ?? 32,
      ...(item.associatedPlayerId
        ? { associatedPlayerId: item.associatedPlayerId }
        : {}),
    };
  });
}

// ── header ──────────────────────────────────────────────────────

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

// ── root ────────────────────────────────────────────────────────

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

// ── main content ────────────────────────────────────────────────

function PlayMakerContent() {
  const {
    isLoading,
    refreshing,
    onRefresh,
    title,
    id: teamId,
  } = useTeamDetailContext();

  const navigation = useNavigation();
  const api = useAxiosWithClerk();

  // ── play-loading state ──────────────────────────────────────
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);
  const [loadedShapes, setLoadedShapes] = useState<Shape[]>([]);

  // ── fetch play IDs ──────────────────────────────────────────
  const {
    data: plays,
    isLoading: playsLoading,
  } = useTeamPlays(teamId);

  // ── fetch selected play's details ───────────────────────────
  const {
    data: playItems,
    isLoading: playItemsLoading,
  } = usePlayDetails(teamId, selectedPlayId);

  // ── convert backend items → shapes when they arrive ─────────
  useEffect(() => {
    if (!playItems) return;
    const shapes = fromBackendPayload(playItems);
    setLoadedShapes(shapes);
  }, [playItems]);

  // ── save logic (unchanged) ──────────────────────────────────
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

  const latestShapesRef = useRef<Shape[]>([]);

  const handleShapesChange = useCallback((shapes: Shape[]) => {
    latestShapesRef.current = shapes;
  }, []);

  const onSave = useCallback(() => {
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

  // ── handle play selection ───────────────────────────────────
  const handleSelectPlay = (playId: string) => {
    if (selectedPlayId === playId) {
      // tapping again deselects → back to empty board
      setSelectedPlayId(null);
      setLoadedShapes([]);
    } else {
      setSelectedPlayId(playId);
    }
  };

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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {/* ── Play list (always visible) ─────────────────────── */}
        {playsLoading ? (
          <ActivityIndicator
            color="white"
            style={{ marginVertical: 16 }}
          />
        ) : plays && plays.length > 0 ? (
          <View style={playStyles.list}>
            {plays.map((id, index) => {
              const isSelected = selectedPlayId === id;

              return (
                <View key={id}>
                  {/* ── Row ──────────────────────────────────── */}
                  <Pressable
                    style={[
                      playStyles.row,
                      isSelected && playStyles.rowSelected,
                    ]}
                    onPress={() => handleSelectPlay(id)}
                  >
                    <Text
                      style={[
                        playStyles.rowText,
                        isSelected && playStyles.rowTextSelected,
                      ]}
                    >
                      Play {index + 1}
                    </Text>

                    {isSelected && playItemsLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={playStyles.chevron}>
                        {isSelected ? "✓" : ">"}
                      </Text>
                    )}
                  </Pressable>

                  {/* ── Expanded board (only for selected play) ─ */}
                  {isSelected && (
                    <View style={playStyles.boardContainer}>
                      <PlayMakerArea
                        key={selectedPlayId}
                        styles={boardStyles}
                        onShapesChange={handleShapesChange}
                        initialShapes={loadedShapes}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* ── "New Play" area (when nothing selected) ──────── */}
        {!selectedPlayId && (
          <View style={{ flex: 1 }}>
            <Text style={playStyles.newPlayLabel}>New Play</Text>
            <PlayMakerArea
              key="new-play"
              styles={boardStyles}
              onShapesChange={handleShapesChange}
            />
          </View>
        )}
      </ScrollView>

      {isLoading ? <ActivityIndicator size="small" color="#fff" /> : null}
    </ContentArea>
  );
}

// ── layout styles for the board inside each play ────────────────

const boardStyles = StyleSheet.create({
  container: { flex: 1 },
  boardWrapper: { height: 300 },
  shapeArea: {
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  panelArea: { height: 200 },
});

// ── play list styles ────────────────────────────────────────────

const playStyles = StyleSheet.create({
  list: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  rowSelected: {
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  rowText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.85,
  },
  rowTextSelected: {
    opacity: 1,
  },
  chevron: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    opacity: 0.6,
  },

  boardContainer: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.2)",
    overflow: "hidden",
    minHeight: 560,
  },

newPlayLabel: {
  color: "white",
  fontSize: 14,
  fontWeight: "600",
  opacity: 0.5,
  textAlign: "left",
  paddingTop: 12,
  paddingBottom: 4,
  paddingLeft: 16,
  letterSpacing: 0.5,
},
});
