import type { ApiPlayShape, Shape } from "@/types/playmaker";
import * as Crypto from "expo-crypto";
import {
  scanBoard,
  hitTest,
  addShapeAt,
  addArrowBetweenShapes,
  assignPlayerToShape,
  isArrowSelectedOnBoard,
  fromBackendPayload,
} from "@/utils/playmaker";

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(),
}));

jest.mock("@/constants/playmaker", () => {
  const actual = jest.requireActual("@/constants/playmaker");
  return {
    ...actual,
    SHAPE_CONFIG: {
      person: {
        create: ({ id, x, y }: { id: string; x: number; y: number }) => ({
          id,
          type: "person",
          x,
          y,
          size: 28,
        }),
      },
      select: {
        create: () => null,
      },
      arrow: {
        create: () => null,
      },
    },
  };
});

const mockedRandomUUID = Crypto.randomUUID as jest.Mock;

function makeSetState<T>(initial: T) {
  let state = initial;
  const setState = jest.fn((updater: ((prev: T) => T) | T) => {
    state =
      typeof updater === "function"
        ? (updater as (prev: T) => T)(state)
        : updater;
  });
  return { getState: () => state, setState };
}

describe("play-maker utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hitTest", () => {
    it("returns the id of the top-most person when point is inside its hitbox", () => {
      const shapes: Shape[] = [
        { id: "p1", type: "person", x: 100, y: 100, size: 28 },
      ];

      const id = hitTest(shapes, 100, 100);
      expect(id).toBe("p1");
    });

    it("returns null when point is outside all shapes", () => {
      const shapes: Shape[] = [
        { id: "p1", type: "person", x: 100, y: 100, size: 28 },
      ];

      const id = hitTest(shapes, 1000, 1000);
      expect(id).toBeNull();
    });

    it("prefers the last shape in the array (top-most)", () => {
      const shapes: Shape[] = [
        { id: "p1", type: "person", x: 100, y: 100, size: 28 },
        { id: "p2", type: "person", x: 100, y: 100, size: 28 },
      ];

      const id = hitTest(shapes, 100, 100);
      expect(id).toBe("p2");
    });
  });

  describe("addShapeAt", () => {
    it("adds a shape and selects it when tool creates a shape", () => {
      mockedRandomUUID.mockReturnValueOnce("new-id");

      const { getState, setState } = makeSetState<Shape[]>([]);
      const setSelected = jest.fn();

      addShapeAt(10, 20, "person", setState, setSelected);

      expect(setState).toHaveBeenCalledTimes(1);
      expect(getState()).toEqual([
        { id: "new-id", type: "person", x: 10, y: 20, size: 28 },
      ]);

      expect(setSelected).toHaveBeenCalledWith("new-id");
    });

    it("does not add anything and clears selection when tool creates null", () => {
      mockedRandomUUID.mockReturnValueOnce("ignored");

      const { getState, setState } = makeSetState<Shape[]>([
        { id: "p1", type: "person", x: 1, y: 2, size: 28 },
      ]);
      const setSelected = jest.fn();

      addShapeAt(10, 20, "select", setState, setSelected);

      expect(getState()).toEqual([
        { id: "p1", type: "person", x: 1, y: 2, size: 28 },
      ]);
      expect(setSelected).toHaveBeenCalledWith(null);
    });
  });

  describe("addArrowBetweenShapes", () => {
    it("adds an arrow if both shapes exist and are endpoints", () => {
      mockedRandomUUID.mockReturnValueOnce("arrow-id");

      const shapes: Shape[] = [
        { id: "p1", type: "person", x: 10, y: 20, size: 28 },
        { id: "p2", type: "person", x: 110, y: 120, size: 30 },
      ];

      const { getState, setState } = makeSetState<Shape[]>(shapes);

      addArrowBetweenShapes("p1", "p2", shapes, setState);

      const next = getState();
      expect(next).toHaveLength(3);

      const arrow = next[2];
      expect(arrow.id).toBe("arrow-id");
      expect(arrow.type).toBe("arrow");
      expect(arrow.from).toMatchObject({ id: "p1", x: 10, y: 20, size: 28 });
      expect(arrow.to).toMatchObject({ id: "p2", x: 110, y: 120, size: 30 });
    });

    it("does nothing if either shape is missing", () => {
      const shapes: Shape[] = [
        { id: "p1", type: "person", x: 10, y: 20, size: 28 },
      ];

      const { getState, setState } = makeSetState<Shape[]>(shapes);

      addArrowBetweenShapes("p1", "missing", shapes, setState);

      expect(getState()).toEqual(shapes);
      expect(setState).not.toHaveBeenCalled();
    });

    it("does nothing if from/to is an arrow (not an endpoint)", () => {
      const shapes: Shape[] = [
        {
          id: "a1",
          type: "arrow",
          from: { id: "f1", x: 0, y: 0 },
          to: { id: "t1", x: 1, y: 1 },
        },
        { id: "p2", type: "person", x: 10, y: 20, size: 28 },
      ];

      const { getState, setState } = makeSetState<Shape[]>(shapes);

      addArrowBetweenShapes("a1", "p2", shapes, setState);

      expect(getState()).toEqual(shapes);
      expect(setState).not.toHaveBeenCalled();
    });
  });

  describe("assignPlayerToShape", () => {
    it("assigns playerId to the selected shape", () => {
      const shapes: Shape[] = [
        { id: "p1", type: "person", x: 0, y: 0, size: 28 },
        { id: "p2", type: "person", x: 1, y: 1, size: 28 },
      ];

      const { getState, setState } = makeSetState<Shape[]>(shapes);

      assignPlayerToShape("member-1", "p2", shapes, setState);

      const next = getState();
      expect(next.find((s) => s.id === "p2")?.associatedPlayerId).toBe(
        "member-1",
      );
      expect(
        next.find((s) => s.id === "p1")?.associatedPlayerId,
      ).toBeUndefined();
    });

    it("does nothing if selectedShapeId is null", () => {
      const shapes: Shape[] = [
        { id: "p1", type: "person", x: 0, y: 0, size: 28 },
      ];
      const { getState, setState } = makeSetState<Shape[]>(shapes);

      assignPlayerToShape("member-1", null, shapes, setState);

      expect(getState()).toEqual(shapes);
      expect(setState).not.toHaveBeenCalled();
    });
  });

  describe("isArrowSelectedOnBoard", () => {
    it("returns true if selectedShapeId points to an arrow", () => {
      const shapes: Shape[] = [
        {
          id: "a1",
          type: "arrow",
          from: { id: "f1", x: 0, y: 0 },
          to: { id: "t1", x: 1, y: 1 },
        },
      ];

      expect(isArrowSelectedOnBoard(shapes, "a1", null)).toBe(true);
    });

    it("returns true if hitId points to an arrow", () => {
      const shapes: Shape[] = [
        {
          id: "a1",
          type: "arrow",
          from: { id: "f1", x: 0, y: 0 },
          to: { id: "t1", x: 1, y: 1 },
        },
      ];

      expect(isArrowSelectedOnBoard(shapes, null, "a1")).toBe(true);
    });

    it("returns false if neither selectedShapeId nor hitId is an arrow id", () => {
      const shapes: Shape[] = [
        { id: "p1", type: "person", x: 0, y: 0, size: 28 },
      ];
      expect(isArrowSelectedOnBoard(shapes, "p1", "p1")).toBe(false);
    });
  });

  describe("scanBoard", () => {
    it("if hit a shape and tool is select, selects that shape and does not add a new shape", () => {
      const shapes: Shape[] = [
        { id: "p1", type: "person", x: 100, y: 100, size: 28 },
      ];

      const { getState, setState } = makeSetState<Shape[]>(shapes);
      const setSelected = jest.fn();

      scanBoard(getState(), 100, 100, "select", setState, null, setSelected);

      expect(setSelected).toHaveBeenCalledWith("p1");
      expect(setState).not.toHaveBeenCalled(); // no new shapes added
    });

    it("if no hit, adds a shape at the point", () => {
      mockedRandomUUID.mockReturnValueOnce("new-id");

      const { getState, setState } = makeSetState<Shape[]>([]);
      const setSelected = jest.fn();

      scanBoard(getState(), 10, 20, "person", setState, null, setSelected);

      expect(getState()).toHaveLength(1);
      expect(setSelected).toHaveBeenCalledWith("new-id");
    });

    it("if hit, tool is arrow, and selectedShapeId exists, adds arrow and selects hit shape", () => {
      mockedRandomUUID.mockReturnValueOnce("arrow-id");

      const shapes: Shape[] = [
        { id: "p1", type: "person", x: 100, y: 100, size: 28 },
        { id: "p2", type: "person", x: 200, y: 200, size: 28 },
      ];

      const { getState, setState } = makeSetState<Shape[]>(shapes);
      const setSelected = jest.fn();

      scanBoard(getState(), 200, 200, "arrow", setState, "p1", setSelected);

      expect(getState()).toHaveLength(3);
      expect(setSelected).toHaveBeenCalledWith("p2");
    });
  });

  describe("fromBackendPayload", () => {
    it("transforms person shapes with explicit coordinates", () => {
      const payload: ApiPlayShape[] = [
        {
          type: "person",
          id: "p1",
          x: 50,
          y: 75,
          size: 28,
        },
      ];

      const shapes = fromBackendPayload(payload);

      expect(shapes).toHaveLength(1);
      expect(shapes[0]).toEqual({
        type: "person",
        id: "p1",
        x: 50,
        y: 75,
        size: 28,
      });
    });

    it("uses fallback values for missing coordinates", () => {
      const payload: ApiPlayShape[] = [
        {
          type: "person",
          id: "p1",
        },
      ];

      const shapes = fromBackendPayload(payload);

      expect(shapes[0]).toEqual({
        type: "person",
        id: "p1",
        x: 0,
        y: 0,
        size: 32,
      });
    });

    it("preserves associatedPlayerId when present", () => {
      const payload: ApiPlayShape[] = [
        {
          type: "person",
          id: "p1",
          x: 10,
          y: 20,
          associatedPlayerId: "player-123",
        },
      ];

      const shapes = fromBackendPayload(payload);

      expect(shapes[0]).toMatchObject({
        type: "person",
        id: "p1",
        associatedPlayerId: "player-123",
      });
    });

    it("skips associatedPlayerId when undefined", () => {
      const payload: ApiPlayShape[] = [
        {
          type: "person",
          id: "p1",
          x: 10,
          y: 20,
        },
      ];

      const shapes = fromBackendPayload(payload);

      expect(shapes[0]).not.toHaveProperty("associatedPlayerId");
    });

    it("resolves arrows with proper person node lookups", () => {
      const payload: ApiPlayShape[] = [
        {
          type: "person",
          id: "p1",
          x: 10,
          y: 20,
          size: 28,
        },
        {
          type: "person",
          id: "p2",
          x: 100,
          y: 120,
          size: 30,
        },
        {
          type: "arrow",
          id: "a1",
          from: { id: "p1" },
          to: { id: "p2" },
        },
      ];

      const shapes = fromBackendPayload(payload);

      expect(shapes).toHaveLength(3);
      const arrow = shapes[2];
      expect(arrow.type).toBe("arrow");
      expect(arrow.from).toEqual({
        id: "p1",
        x: 10,
        y: 20,
        size: 28,
      });
      expect(arrow.to).toEqual({
        id: "p2",
        x: 100,
        y: 120,
        size: 30,
      });
    });

    it("skips arrows with missing from/to node references", () => {
      const payload: ApiPlayShape[] = [
        {
          type: "person",
          id: "p1",
          x: 10,
          y: 20,
        },
        {
          type: "arrow",
          id: "a1",
          from: { id: "p1" },
          to: { id: "missing-node" },
        },
      ];

      const shapes = fromBackendPayload(payload);

      expect(shapes).toHaveLength(1);
      expect(shapes[0].type).toBe("person");
    });

    it("handles mixed payload with people and valid arrows", () => {
      const payload: ApiPlayShape[] = [
        { type: "person", id: "p1", x: 10, y: 20, size: 28 },
        { type: "person", id: "p2", x: 100, y: 120, size: 30 },
        {
          type: "arrow",
          id: "a1",
          from: { id: "p1" },
          to: { id: "p2" },
        },
        {
          type: "arrow",
          id: "a2",
          from: { id: "p2" },
          to: { id: "missing" },
        },
      ];

      const shapes = fromBackendPayload(payload);

      expect(shapes).toHaveLength(3);
      expect(shapes.filter((s) => s.type === "person")).toHaveLength(2);
      expect(shapes.filter((s) => s.type === "arrow")).toHaveLength(1);
    });

    it("converts string coordinates to numbers", () => {
      const payload: ApiPlayShape[] = [
        {
          type: "person",
          id: "p1",
          x: "50" as any,
          y: "75" as any,
          size: "28" as any,
        },
      ];

      const shapes = fromBackendPayload(payload);

      expect(shapes[0]).toEqual({
        type: "person",
        id: "p1",
        x: 50,
        y: 75,
        size: 28,
      });
    });

    it("uses fallback for NaN string values", () => {
      const payload: ApiPlayShape[] = [
        {
          type: "person",
          id: "p1",
          x: "invalid" as any,
          y: "also-invalid" as any,
        },
      ];

      const shapes = fromBackendPayload(payload);

      expect(shapes[0]).toEqual({
        type: "person",
        id: "p1",
        x: 0,
        y: 0,
        size: 32,
      });
    });

    it("returns empty array for empty payload", () => {
      const shapes = fromBackendPayload([]);
      expect(shapes).toEqual([]);
    });
  });
});
