import { useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PlayMakerBoard } from "@/components/play-maker/play-maker-board";
import { ShapesTab } from "@/components/play-maker/shapes-tab";
import type { Shape, PersonShape } from "@/components/play-maker/model";
import { scanBoard } from "@/components/play-maker/utils";
import { useRenderPlayMakerShapes } from "@/hooks/use-render-play-maker-shapes";
import { ClearShapesButton } from "@/components/play-maker/clear-shapes-button";
import { PlayerAssignmentPanel } from "@/components/play-maker/player-assignment-panel";
import { useGetTeamMembers } from "@/hooks/use-get-team-members/use-get-team-members";
import { useTeamDetailContext } from "@/contexts/team-detail-context";
import { PlayerCardsOverlay } from "@/components/play-maker/player-cards-overlay";

type PlayMakerAreaWithCallbackProps = any & {
  onShapesChange?: (shapes: Shape[]) => void;
};

const isAssignedPersonShape = (shape: Shape): shape is PersonShape => {
  return shape.type === "person" && !!shape.associatedPlayerId;
};

export const PlayMakerArea = ({
  styles,
  boardConfig: BoardConfig,
  onShapesChange,
}: PlayMakerAreaWithCallbackProps) => {
  const [selectedTool, setSelectedTool] = useState<any>("person");
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);

  const { id: teamId } = useTeamDetailContext();
  const storageKey = `playmaker:${teamId}`;
  const { data, isLoading } = useGetTeamMembers(teamId);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (!saved) return;

        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setShapes(parsed);
        }
      } catch {
        // ignore
      }
    })();
  }, [storageKey]);

  useEffect(() => {
    onShapesChange?.(shapes);
  }, [shapes, onShapesChange]);

  useEffect(() => {
    AsyncStorage.setItem(storageKey, JSON.stringify(shapes)).catch(() => {});
  }, [shapes, storageKey]);

  const assignedPersonShapes = useMemo(
    () => shapes.filter(isAssignedPersonShape),
    [shapes],
  );

  const svgShapes = useMemo(
    () =>
      shapes.filter(
        (shape) => !(shape.type === "person" && !!shape.associatedPlayerId),
      ),
    [shapes],
  );

  const renderedShapes = useRenderPlayMakerShapes(
    svgShapes,
    selectedShapeId,
    setSelectedShapeId,
  );

  const playersById = useMemo(() => {
    const members = Array.isArray(data) ? data : [];
    return Object.fromEntries(
      members.map((player: any) => [String(player.id), player]),
    );
  }, [data]);

  return (
    <View style={styles.container}>
      <View style={styles.boardWrapper}>
        <PlayMakerBoard
          boardConfig={BoardConfig}
          selectedTool={selectedTool}
          selectedShapeId={selectedShapeId}
          onBoardPress={({ x, y }) =>
            scanBoard(
              shapes,
              x,
              y,
              selectedTool,
              setShapes,
              selectedShapeId,
              setSelectedShapeId,
            )
          }
          overlayChildren={
            <PlayerCardsOverlay
              shapes={assignedPersonShapes}
              selectedShapeId={selectedShapeId}
              onSelect={setSelectedShapeId}
              playersById={playersById}
            />
          }
        >
          {renderedShapes}
        </PlayMakerBoard>
      </View>

      <View style={styles.shapeArea}>
        <ShapesTab selectedTool={selectedTool} onSelectTool={setSelectedTool} />
        <ClearShapesButton
          shapes={shapes}
          setShapes={setShapes}
          selectedShapeId={selectedShapeId}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator testID="team-loading" size="large" color="white" />
      ) : (
        <View style={styles.panelArea}>
          <PlayerAssignmentPanel
            data={data}
            selectedShapeId={selectedShapeId}
            shapes={shapes}
            setShapes={setShapes}
          />
        </View>
      )}
    </View>
  );
};
