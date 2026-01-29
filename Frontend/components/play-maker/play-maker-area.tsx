import { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { PlayMakerBoard } from "@/components/play-maker/play-maker-board";
import { ShapesTab } from "@/components/play-maker/shapes-tab";
import type {
  Shape,
  ShapeTool,
  PlayMakerAreaProps,
} from "@/components/play-maker/model";
import { scanBoard } from "@/components/play-maker/utils";
import { useRenderPlayMakerShapes } from "@/hooks/use-render-play-maker-shapes";
import { ClearShapesButton } from "@/components/play-maker/clear-shapes-button";
import { PlayerAssignmentPanel } from "./player-assignment-panel";
import { useGetTeamMembers } from "@/hooks/use-get-team-members/use-get-team-members";
import { useTeamDetailContext } from "@/contexts/team-detail-context";

export const PlayMakerArea = ({
  styles,
  boardConfig: BoardConfig,
}: PlayMakerAreaProps) => {
  const [selectedTool, setSelectedTool] = useState<ShapeTool>("person");
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);

  const { id: teamId } = useTeamDetailContext();
  const { data, isLoading } = useGetTeamMembers(teamId);

  const renderedShapes = useRenderPlayMakerShapes(
    shapes,
    selectedShapeId,
    (id) => setSelectedShapeId(id),
  );

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
