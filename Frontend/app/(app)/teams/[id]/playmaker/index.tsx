import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { FormToolbar } from "@/components/form/form-toolbar";
import { Stack, useLocalSearchParams } from "expo-router";
import type {
  PlaymakerToolbarProps,
  Shape,
  ShapeTool,
} from "@/types/playmaker";
import { useRenderPlayMakerShapes } from "@/hooks/use-render-play-maker-shapes";
import {
  StyleSheet,
  View,
  Pressable,
  Text,
  ScrollView,
  RefreshControl,
} from "react-native";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { Background } from "@/components/ui/background";
import { useGetTeamMembers } from "@/hooks/use-get-team-members";
import { DefaultBoard } from "@/components/play-maker/play-maker-default-board";
import { GlassView } from "expo-glass-effect";
import { Card } from "@/components/ui/card";
import {
  assignPlayerToShape,
  buildPlaymakerStorageKey,
  loadSavedPlaymakerShapes,
  persistPlaymakerShapes,
  scanBoard,
  savePlaymaker,
} from "@/utils/playmaker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@/hooks/use-header-height";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";

function PlaymakerToolbar({
  onSubmit,
  onUndo,
  loading,
  selectedTool,
  setSelectedTool,
  shapes,
  setShapes,
  selectedShapeId,
}: PlaymakerToolbarProps) {
  return (
    <>
      <FormToolbar title="Playmaker" onSubmit={onSubmit} loading={loading} />
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.Button
          onPress={() => setSelectedTool("select")}
          selected={selectedTool === "select"}
          tintColor="white"
          icon="pointer.arrow"
        >
          Select
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button
          onPress={() => setSelectedTool("person")}
          selected={selectedTool === "person"}
          tintColor="white"
          icon="person"
        >
          Person
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button
          onPress={() => setSelectedTool("arrow")}
          selected={selectedTool === "arrow"}
          tintColor="white"
          icon="arrow.up.forward"
        >
          Arrow
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button onPress={onUndo} icon="arrow.uturn.backward">
          Undo
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button
          onPress={() =>
            setShapes(shapes.filter((shape) => shape.id !== selectedShapeId))
          }
          icon="trash"
        >
          Delete
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button
          onPress={() => setShapes([])}
          icon="arrow.counterclockwise"
        >
          Reset
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}

export default function PlayMaker() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const teamId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  return (
    <TeamDetailProvider id={teamId}>
      <PlayMakerContent />
    </TeamDetailProvider>
  );
}

function PlayMakerContent() {
  const {
    isLoading,
    id: teamId,
    onRefresh,
    refreshing,
  } = useTeamDetailContext();
  const api = useAxiosWithClerk();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const storageKey = buildPlaymakerStorageKey(teamId);
  const { data: teamMembers, isLoading: isTeamMembersLoading } =
    useGetTeamMembers(teamId);
  const headerHeight = useHeaderHeight();

  const shapesHistoryRef = useRef<Shape[][]>([]);
  const latestShapesRef = useRef<Shape[]>([]);
  const [selectedTool, setSelectedTool] = useState<ShapeTool>("person");
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [shapes, setShapesState] = useState<Shape[]>([]);
  const [saving, setSaving] = useState(false);

  const setShapes = useCallback((updater: SetStateAction<Shape[]>) => {
    setShapesState((prev) => {
      const next =
        typeof updater === "function"
          ? (updater as (prev: Shape[]) => Shape[])(prev)
          : updater;

      const isSameState =
        prev.length === next.length &&
        prev.every((shape, index) => shape === next[index]);

      if (isSameState) {
        return prev;
      }

      shapesHistoryRef.current.push(prev);
      return next;
    });
  }, []);

  useEffect(() => {
    (async () => {
      const savedShapes = await loadSavedPlaymakerShapes(storageKey);
      if (savedShapes) {
        shapesHistoryRef.current = [];
        setShapesState(savedShapes);
      }
    })();
  }, [storageKey]);

  useEffect(() => {
    latestShapesRef.current = shapes;
  }, [shapes]);

  useEffect(() => {
    if (
      selectedShapeId &&
      !shapes.some((shape) => shape.id === selectedShapeId)
    ) {
      setSelectedShapeId(null);
    }
  }, [selectedShapeId, shapes]);

  useEffect(() => {
    persistPlaymakerShapes(storageKey, shapes).catch(() => {});
  }, [shapes, storageKey]);

  const memberImageMap = useMemo(() => {
    const nextMap = new Map<string, string>();
    teamMembers?.forEach((member) => {
      const imageUrl = member.imageUrl ?? null;
      if (!imageUrl) {
        return;
      }

      nextMap.set(member.id, imageUrl);
      if (member.userId) {
        nextMap.set(member.userId, imageUrl);
      }
    });
    return nextMap;
  }, [teamMembers]);

  const getPlayerImage = useCallback((playerId?: string) => {
    if (!playerId) {
      return null;
    }

    return memberImageMap.get(playerId) ?? null;
  }, [memberImageMap]);

  const renderedShapes = useRenderPlayMakerShapes(
    shapes,
    selectedShapeId,
    getPlayerImage,
    (id) => setSelectedShapeId(id),
  );

  const handleRefresh = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onRefresh();
  }, [onRefresh]);

  const onSave = useCallback(async () => {
    await savePlaymaker({
      api,
      teamId,
      latestShapesRef,
      setSaving,
    });
  }, [api, teamId]);

  const onUndo = useCallback(() => {
    const previousShapes = shapesHistoryRef.current.pop();
    if (!previousShapes) {
      return;
    }

    setShapesState(previousShapes);
  }, []);

  const membersLoading = isLoading || isTeamMembersLoading;
  const hasMembers = (teamMembers?.length ?? 0) > 0;

  return (
    <>
      <Background preset="red" />
      <PlaymakerToolbar
        onSubmit={onSave}
        onUndo={onUndo}
        loading={saving}
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        shapes={shapes}
        setShapes={setShapes}
        selectedShapeId={selectedShapeId}
      />
      <View
        style={[
          styles.container,
          {
            paddingBottom: bottomInset + 50,
            paddingTop: headerHeight,
          },
        ]}
      >
        <GlassView isInteractive={false} style={styles.boardWrapper}>
          <Pressable
            testID="playmaker-board-pressable"
            style={styles.boardPressable}
            onPress={(e) => {
              const { locationX, locationY } = e.nativeEvent;
              scanBoard(
                shapes,
                locationX,
                locationY,
                selectedTool,
                setShapes,
                selectedShapeId,
                setSelectedShapeId,
              );
            }}
          >
            <DefaultBoard>{renderedShapes}</DefaultBoard>
          </Pressable>
        </GlassView>

        {membersLoading ? (
          <Loading />
        ) : !hasMembers ? (
          <Empty message="No team members available" />
        ) : (
          <ScrollView
            style={styles.assignmentScroll}
            contentContainerStyle={styles.assignmentScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            {teamMembers?.map((member) => {
              const isAssigned = shapes.filter(
                (shape) =>
                  shape.associatedPlayerId === member.id &&
                  shape.id === selectedShapeId,
              ).length;

              return (
                <View key={member.id}>
                  <Card
                    isInteractive={false}
                    tintColor={isAssigned ? "rgba(195,175,41,0.2)" : undefined}
                  >
                    <View style={styles.assignmentRow}>
                      <Text style={styles.assignmentName}>
                        {member.firstname} {member.lastname}
                      </Text>
                      <GlassView
                        style={styles.assignButton}
                        isInteractive={true}
                      >
                        <Pressable
                          onPress={() => {
                            assignPlayerToShape(
                              member.id,
                              selectedShapeId,
                              shapes,
                              setShapes,
                            );
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Assign ${member.firstname} ${member.lastname} to player icon`}
                        >
                          <Text style={styles.assignButtonText}>Assign</Text>
                        </Pressable>
                      </GlassView>
                    </View>
                  </Card>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
    overflow: "visible",
  },
  boardWrapper: {
    height: 400,
    borderRadius: 34,
    overflow: "hidden",
    zIndex: 1,
  },
  boardPressable: { flex: 1, overflow: "hidden" },
  assignmentScroll: {
    flex: 1,
    overflow: "visible",
  },
  assignmentScrollContent: {
    gap: 10,
    paddingBottom: 8,
  },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  assignmentName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.9,
    flexShrink: 1,
  },
  assignButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  assignButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.95,
  },
});
