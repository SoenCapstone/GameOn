import type { Shape, ShapeTool } from "@/types/playmaker";

export const PLAYMAKER_STORAGE_KEY_PREFIX = "playmaker:";

type CreateContext = { id: string; x: number; y: number };

type ShapeConfigEntry<T extends ShapeTool> = {
  type: T;
  create: (ctx: CreateContext) => Extract<Shape, { type: T }> | null;
};

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
