import { TeamMember } from "@/hooks/use-get-team-members/model";
import {
  UNDO_SVG,
  CLEAR_ALL_SVG,
  PERSON_SVG,
  LINE_SVG,
  REMOVE_CURRENT,
  COLOR_WHITE,
  SELECT_SVG,
} from "@/components/play-maker/play-maker-icon/constants";
import { ViewStyle } from "react-native";

export type BoardConfigProps = {
  children?: React.ReactNode;
};

export type PlayMakerAreaProps = {
  boardConfig?: React.ComponentType<BoardConfigProps>;
  styles: {
    container: ViewStyle;
    boardWrapper: ViewStyle;
    shapeArea: ViewStyle;
    panelArea: ViewStyle;
  };
};

export type PlayMakerBoardProps = {
  boardConfig?: React.ComponentType<BoardConfigProps>;
  selectedTool: ShapeTool;
  selectedShapeId?: string | null;
  onBoardPress?: (pos: { x: number; y: number }) => void;
  children?: React.ReactNode;
};

export type ShapesTabProps = {
  selectedTool: ShapeTool;
  onSelectTool: (tool: ShapeTool) => void;
};

export type ClearShapesButtonProps = {
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  selectedShapeId?: string | null;
};

export type PlayerAssignmentPanelProps = {
  data: TeamMember[] | undefined;
  selectedShapeId: string | null;
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
};

type ShapeMetadata = {
  id: string;
  x: number;
  y: number;
  size?: number;
};

export type Shape =
  | {
      id: string;
      type: "select";
      x: number;
      y: number;
      r: number;
      associatedPlayerId?: string;
      from?: ShapeMetadata;
      to?: ShapeMetadata;
    }
  | {
      id: string;
      type: "arrow";
      from?: ShapeMetadata;
      to?: ShapeMetadata;
      associatedPlayerId?: string;
    }
  | {
      id: string;
      type: "person";
      x: number;
      y: number;
      size: number;
      associatedPlayerId?: string;
      from?: ShapeMetadata;
      to?: ShapeMetadata;
    };

export type EndpointShape = Exclude<Shape, { type: "arrow" }>;

export type ShapeTool = Shape["type"];

type CreateContext = { id: string; x: number; y: number };

type ShapeConfigEntry<T extends ShapeTool> = {
  type: T;
  create: (ctx: CreateContext) => Extract<Shape, { type: T }> | null;
};

export const SELECT_SHAPE_BUTTON_CONFIG: {
  tool: ShapeTool;
  size: number;
  xml: string;
}[] = [
  {
    tool: "select",
    size: 22,
    xml: SELECT_SVG.replaceAll("currentColor", COLOR_WHITE),
  },
  {
    tool: "person",
    size: 22,
    xml: PERSON_SVG.replaceAll("currentColor", COLOR_WHITE),
  },
  {
    tool: "arrow",
    size: 22,
    xml: LINE_SVG.replaceAll("currentColor", COLOR_WHITE),
  },
];

export const CLEAR_SHAPES_BUTTON_CONFIG = [
  {
    tool: "Undo",
    size: 22,
    xml: UNDO_SVG.replace(/currentColor/g, COLOR_WHITE),
    onPress: (
      shapes: Shape[],
      setShapes: React.Dispatch<React.SetStateAction<Shape[]>>,
      selectedShapeId: string | null | undefined,
    ) => setShapes(shapes.slice(0, -1)),
  },
  {
    tool: "Delete",
    size: 22,
    xml: REMOVE_CURRENT.replace(/currentColor/g, COLOR_WHITE),
    onPress: (
      shapes: Shape[],
      setShapes: React.Dispatch<React.SetStateAction<Shape[]>>,
      selectedShapeId: string | null | undefined,
    ) => setShapes(shapes.filter((shape) => shape.id !== selectedShapeId)),
  },
  {
    tool: "Reset",
    size: 22,
    xml: CLEAR_ALL_SVG.replace(/currentColor/g, COLOR_WHITE),
    onPress: (
      shapes: Shape[],
      setShapes: React.Dispatch<React.SetStateAction<Shape[]>>,
      selectedShapeId: string | null | undefined,
    ) => setShapes([]),
  },
];

export const SHAPE_CONFIG: { [K in ShapeTool]: ShapeConfigEntry<K> } = {
  select: {
    type: "select",
    create: () => null,
  },
  arrow: {
    type: "arrow",
    create: () => null,
  },
  person: {
    type: "person",
    create: ({ id, x, y }) => ({
      id,
      type: "person",
      x,
      y,
      size: 32,
    }),
  },
};
