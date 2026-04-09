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
import { toast } from "@/utils/toast";
import type {
  ApiPlayShape,
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
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorToString } from "@/utils/error";
import { Background } from "@/components/ui/background";
import { useGetTeamMembers } from "@/hooks/use-get-team-members";
import { DefaultBoard } from "@/components/play-maker/play-maker-default-board";
import { GlassView } from "expo-glass-effect";
import { Card } from "@/components/ui/card";
import {
  assignPlayerToShape,
  scanBoard,
  toPlaymakerPayload,
  fromBackendPayload,
} from "@/utils/playmaker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@/hooks/use-header-height";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";
import { usePlayDetails } from "@/hooks/use-play-details";
import { useTeamPlays } from "@/hooks/use-team-plays";

function PlaymakerToolbar({
  title,
  onSubmit,
  onUndo,
  loading,
  selectedTool,
  setSelectedTool,
  shapes,
  setShapes,
  selectedShapeId,
  currentPlayId,
  onPlaySelect,
  onNewPlay,
  plays,
  playsLoading,
}: PlaymakerToolbarProps & {
  title: string;
  currentPlayId: string | null;
  onPlaySelect: (playId: string) => void;
  onNewPlay: () => void;
  plays: string[];
  playsLoading: boolean;
}) {
  return (
    <>
      <FormToolbar
        title={title}
        onSubmit={onSubmit}
        loading={loading}
        menu={
          <Stack.Toolbar.Menu icon="ellipsis">
            <Stack.Toolbar.Menu title="Saved Plays" icon="rectangle.stack">
              {plays.length > 0 ? (
                plays.map((playId, index) => (
                  <Stack.Toolbar.MenuAction
                    key={playId}
                    onPress={() => onPlaySelect(playId)}
                    icon={currentPlayId === playId ? "checkmark" : undefined}
                  >
                    {`Play ${index + 1}`}
                  </Stack.Toolbar.MenuAction>
                ))
              ) : (
                <Stack.Toolbar.MenuAction onPress={() => undefined}>
                  No saved plays
                </Stack.Toolbar.MenuAction>
              )}
            </Stack.Toolbar.Menu>
            <Stack.Toolbar.MenuAction icon="plus" onPress={onNewPlay}>
              New Play
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        }
      />
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
  const queryClient = useQueryClient();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { data: teamMembers, isLoading: isTeamMembersLoading } =
    useGetTeamMembers(teamId);
  const { data: playsData, isLoading: playsLoading } = useTeamPlays(teamId);
  const headerHeight = useHeaderHeight();

  const [currentPlayId, setCurrentPlayId] = useState<string | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedTool, setSelectedTool] = useState<ShapeTool>("person");
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  const { data: playItems, isLoading: isPlayLoading } = usePlayDetails(
    teamId,
    currentPlayId,
  );

  const plays = useMemo(() => {
    if (Array.isArray(playsData)) {
      return playsData.filter(
        (play): play is string => typeof play === "string",
      );
    }
    return [];
  }, [playsData]);

  const isEditing = Boolean(currentPlayId);
  const toolbarTitle = isEditing ? `Play ${plays.indexOf(currentPlayId!) + 1}` : "New Play";

  const savePlayMutation = useMutation({
    mutationFn: async (shapesToSave: Shape[]) => {
      const payload = toPlaymakerPayload(shapesToSave);
      if (currentPlayId) {
        const route = GO_TEAM_SERVICE_ROUTES.UPDATE_PLAY(teamId, currentPlayId);
        return api.put(route, payload);
      }

      const route = GO_TEAM_SERVICE_ROUTES.CREATE_PLAY(teamId);
      return api.post(route, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-plays", teamId] });
      if (currentPlayId) {
        queryClient.invalidateQueries({
          queryKey: ["play-details", teamId, currentPlayId],
        });
      }
      toast.success(isEditing ? "Updated" : "Saved", {
        description: isEditing
          ? "Your play was updated successfully."
          : "Your play was saved successfully.",
      });
    },
    onError: (err) => {
      toast.error("Error While Saving Play", {
        description: errorToString(err),
      });
    },
  });

  const shapesHistoryRef = useRef<Shape[][]>([]);
  const latestShapesRef = useRef<Shape[]>([]);

  useEffect(() => {
    if (!Array.isArray(playItems)) {
      return;
    }

    setShapes(fromBackendPayload(playItems as ApiPlayShape[]));
    setSelectedShapeId(null);
    setSelectedTool("select");
    shapesHistoryRef.current = [];
  }, [playItems]);

  const updateShapes = useCallback((updater: SetStateAction<Shape[]>) => {
    setShapes((prev) => {
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

  const getPlayerImage = useCallback(
    (playerId?: string) => {
      if (!playerId) {
        return null;
      }

      return memberImageMap.get(playerId) ?? null;
    },
    [memberImageMap],
  );

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

  const onSave = useCallback(() => {
    const shapesToSave = latestShapesRef.current;
    if (!shapesToSave || shapesToSave.length === 0) {
      toast.warning("Nothing To Save", {
        description: "Add some shapes on the board first.",
      });
      return;
    }
    savePlayMutation.mutate(shapesToSave);
  }, [savePlayMutation]);

  const onUndo = useCallback(() => {
    const previousShapes = shapesHistoryRef.current.pop();
    if (!previousShapes) {
      return;
    }

    setShapes(previousShapes);
  }, []);

  const handlePlaySelect = useCallback((playId: string) => {
    setCurrentPlayId(playId);
  }, []);

  const handleNewPlay = useCallback(() => {
    if (currentPlayId) {
      setCurrentPlayId(null);
      setShapes([]);
      setSelectedShapeId(null);
      setSelectedTool("person");
      shapesHistoryRef.current = [];
    }
  }, [currentPlayId]);

  const membersLoading = isLoading || isTeamMembersLoading || isPlayLoading;
  const hasMembers = (teamMembers?.length ?? 0) > 0;

  return (
    <>
      <Background preset="red" />
      <PlaymakerToolbar
        title={toolbarTitle}
        onSubmit={onSave}
        onUndo={onUndo}
        loading={savePlayMutation.isPending}
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        shapes={shapes}
        setShapes={updateShapes}
        selectedShapeId={selectedShapeId}
        currentPlayId={currentPlayId}
        onPlaySelect={handlePlaySelect}
        onNewPlay={handleNewPlay}
        plays={plays}
        playsLoading={playsLoading}
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
                updateShapes,
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
                              updateShapes,
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
