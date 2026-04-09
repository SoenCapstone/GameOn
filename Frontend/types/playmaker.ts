import type { Dispatch, SetStateAction } from "react";

export type ShapeMetadata = {
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

export type PlaymakerToolbarProps = Readonly<{
  title: string;
  currentPlayId: string | null;
  onPlaySelect: (playId: string) => void;
  onNewPlay: () => void;
  plays: string[];
  onSubmit: () => void;
  onUndo: () => void;
  loading: boolean;
  selectedTool: ShapeTool;
  setSelectedTool: Dispatch<SetStateAction<ShapeTool>>;
  shapes: Shape[];
  setShapes: Dispatch<SetStateAction<Shape[]>>;
  selectedShapeId: string | null;
}>;

export type PlaymakerPayloadItem =
  | {
      type: "arrow";
      id: string;
      from?: Shape["from"];
      to?: Shape["to"];
    }
  | {
      type: "person";
      id: string;
      x: number;
      y: number;
      size: number;
      associatedPlayerId?: string;
    };

export type ApiPersonShape = {
  type: "person";
  id: string;
  x?: number;
  y?: number;
  size?: number;
  associatedPlayerId?: string;
};

export type ApiArrowShape = {
  type: "arrow";
  id: string;
  from?: {
    id?: string;
  };
  to?: {
    id?: string;
  };
};

export type ApiPlayShape = ApiPersonShape | ApiArrowShape;
