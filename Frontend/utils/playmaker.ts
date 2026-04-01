import type { Dispatch, SetStateAction } from "react";
import * as Crypto from "expo-crypto";
import type {
  EndpointShape,
  PlaymakerPayloadItem,
  Shape,
  ShapeTool,
} from "@/types/playmaker";
import { SHAPE_CONFIG } from "@/constants/playmaker";

export const scanBoard = (
  shapes: Shape[],
  x: number,
  y: number,
  selectedTool: ShapeTool,
  setShapes: Dispatch<SetStateAction<Shape[]>>,
  selectedShapeId: string | null,
  setSelectedShapeId: Dispatch<SetStateAction<string | null>>,
) => {
  const hitId = hitTest(shapes, x, y);
  if (hitId) {
    if (
      selectedTool === "arrow" &&
      selectedShapeId &&
      !isArrowSelectedOnBoard(shapes, selectedShapeId, hitId) &&
      selectedShapeId !== hitId
    ) {
      addArrowBetweenShapes(selectedShapeId, hitId, shapes, setShapes);
      setSelectedShapeId(hitId);
    }
    if (selectedTool === "select") {
      setSelectedShapeId(hitId);
    }
    return;
  }

  addShapeAt(x, y, selectedTool, setShapes, setSelectedShapeId);
};

export const isArrowSelectedOnBoard = (
  shapes: Shape[],
  selectedShapeId: string | null,
  hitId: string | null,
): boolean => {
  return !!(
    shapes.filter(
      (shape) => shape.type === "arrow" && selectedShapeId === shape.id,
    ).length ||
    shapes.filter((shape) => shape.type === "arrow" && hitId === shape.id)
      .length
  );
};

export const hitTest = (
  shapes: Shape[],
  x: number,
  y: number,
): string | null => {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];

    if (s.type === "person") {
      const size = s.size ?? 28;
      const hitPadding = 8;
      const left = s.x - size / 2 - hitPadding;
      const top = s.y - size / 2 - hitPadding;
      const w = size + hitPadding * 2;
      const h = size + hitPadding * 2;

      const inside = x >= left && x <= left + w && y >= top && y <= top + h;
      if (inside) return s.id;
    }
  }

  return null;
};

export const addShapeAt = (
  x: number,
  y: number,
  selectedTool: ShapeTool,
  setShapes: Dispatch<SetStateAction<Shape[]>>,
  setSelectedShapeId: Dispatch<SetStateAction<string | null>>,
) => {
  const id = Crypto.randomUUID();
  const shape = SHAPE_CONFIG[selectedTool].create({ id, x, y });

  if (!shape) {
    setSelectedShapeId(null);
    return;
  }

  setShapes((prev) => [...prev, shape]);
  setSelectedShapeId(id);
};

export const addArrowBetweenShapes = (
  fromId: string,
  toId: string,
  shapes: Shape[],
  setShapes: Dispatch<SetStateAction<Shape[]>>,
) => {
  const fromShape = shapes.find((s) => s.id === fromId);
  const toShape = shapes.find((s) => s.id === toId);

  if (!fromShape || !toShape) return;
  if (!isEndpointShape(fromShape) || !isEndpointShape(toShape)) return;

  setShapes((prev) => [
    ...prev,
    {
      id: Crypto.randomUUID(),
      type: "arrow",
      from: {
        id: fromShape.id,
        x: fromShape.x,
        y: fromShape.y,
        size: getEndpointSize(fromShape),
      },
      to: {
        id: toShape.id,
        x: toShape.x,
        y: toShape.y,
        size: getEndpointSize(toShape),
      },
    },
  ]);
};

export const assignPlayerToShape = (
  playerId: string,
  selectedShapeId: string | null,
  shapes: Shape[],
  setShapes: Dispatch<SetStateAction<Shape[]>>,
) => {
  if (!selectedShapeId || !shapes) return;

  setShapes((prevShapes) =>
    prevShapes.map((shape) => {
      const shouldUnassign = shape.associatedPlayerId === playerId;
      const shouldAssign = shape.id === selectedShapeId;

      if (shouldUnassign && !shouldAssign) {
        const { associatedPlayerId, ...rest } = shape;
        return rest;
      }

      if (shouldAssign) {
        return {
          ...shape,
          associatedPlayerId: playerId,
        };
      }

      return shape;
    })
  );
};

export function toPlaymakerPayload(shapes: Shape[]): PlaymakerPayloadItem[] {
  return shapes
    .filter((shape): shape is Exclude<Shape, { type: "select" }> => {
      return shape.type !== "select";
    })
    .map((shape) => {
      if (shape.type === "arrow") {
        return {
          type: "arrow",
          id: shape.id,
          from: shape.from,
          to: shape.to,
        };
      }

      return {
        type: "person",
        id: shape.id,
        x: shape.x,
        y: shape.y,
        size: shape.size,
        ...(shape.associatedPlayerId
          ? { associatedPlayerId: shape.associatedPlayerId }
          : {}),
      };
    });
}


const isEndpointShape = (shape: Shape): shape is EndpointShape =>
  shape.type !== "arrow";

const getEndpointSize = (shape: EndpointShape): number | undefined =>
  shape.type === "person" ? shape.size : undefined;
