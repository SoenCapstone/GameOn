import {
  CLEAR_SHAPES_BUTTON_CONFIG,
  SHAPE_CONFIG,
  SELECT_SHAPE_BUTTON_CONFIG,
  Shape,
} from "@/components/play-maker/model";

describe("model.ts", () => {
  describe("SELECT_SHAPE_BUTTON_CONFIG", () => {
    it("contains three configurations for select, person, and arrow tools with properties", () => {
      expect(SELECT_SHAPE_BUTTON_CONFIG).toHaveLength(3);
      const tools = ["select", "person", "arrow"];
      
      tools.forEach((tool) => {
        const config = SELECT_SHAPE_BUTTON_CONFIG.find((c) => c.tool === tool);
        expect(config).toBeDefined();
        expect(config?.size).toBe(22);
        expect(config?.xml).toBeTruthy();
      });
    });
  });

  describe("CLEAR_SHAPES_BUTTON_CONFIG", () => {
    let mockSetShapes: jest.Mock;
    let mockShapes: Shape[];

    beforeEach(() => {
      mockSetShapes = jest.fn();
      mockShapes = [
        { id: "1", type: "person", x: 10, y: 20, size: 32 },
        { id: "2", type: "person", x: 30, y: 40, size: 32 },
        { id: "3", type: "arrow", from: { id: "1", x: 10, y: 20 }, to: { id: "2", x: 30, y: 40 } },
      ];
    });

    it("contains three button configurations with correct properties", () => {
      expect(CLEAR_SHAPES_BUTTON_CONFIG).toHaveLength(3);
      
      CLEAR_SHAPES_BUTTON_CONFIG.forEach((config) => {
        expect(config.size).toBe(22);
        expect(config.xml).toBeTruthy();
        expect(config.onPress).toBeInstanceOf(Function);
      });
    });

    it("Undo button removes last shape and handles edge cases", () => {
      const undoConfig = CLEAR_SHAPES_BUTTON_CONFIG[0];
      expect(undoConfig.tool).toBe("Undo");
      
      undoConfig.onPress(mockShapes, mockSetShapes, null);
      expect(mockSetShapes).toHaveBeenCalledWith([
        { id: "1", type: "person", x: 10, y: 20, size: 32 },
        { id: "2", type: "person", x: 30, y: 40, size: 32 },
      ]);

      mockSetShapes.mockClear();
      const singleShape = [{ id: "1", type: "person", x: 10, y: 20, size: 32 }] as Shape[];
      undoConfig.onPress(singleShape, mockSetShapes, null);
      expect(mockSetShapes).toHaveBeenCalledWith([]);

      mockSetShapes.mockClear();
      undoConfig.onPress([], mockSetShapes, null);
      expect(mockSetShapes).toHaveBeenCalledWith([]);
    });

    it("Delete button removes selected shape and handles missing/null selection", () => {
      const deleteConfig = CLEAR_SHAPES_BUTTON_CONFIG[1];
      expect(deleteConfig.tool).toBe("Delete");
      
      deleteConfig.onPress(mockShapes, mockSetShapes, "2");
      expect(mockSetShapes).toHaveBeenCalledWith([
        { id: "1", type: "person", x: 10, y: 20, size: 32 },
        { id: "3", type: "arrow", from: { id: "1", x: 10, y: 20 }, to: { id: "2", x: 30, y: 40 } },
      ]);

      mockSetShapes.mockClear();
      deleteConfig.onPress(mockShapes, mockSetShapes, null);
      expect(mockSetShapes).toHaveBeenCalledWith(mockShapes);

      mockSetShapes.mockClear();
      deleteConfig.onPress(mockShapes, mockSetShapes, "nonexistent");
      expect(mockSetShapes).toHaveBeenCalledWith(mockShapes);

      mockSetShapes.mockClear();
      deleteConfig.onPress([], mockSetShapes, "1");
      expect(mockSetShapes).toHaveBeenCalledWith([]);
    });

    it("Reset button clears all shapes", () => {
      const resetConfig = CLEAR_SHAPES_BUTTON_CONFIG[2];
      expect(resetConfig.tool).toBe("Reset");
      
      resetConfig.onPress(mockShapes, mockSetShapes, null);
      expect(mockSetShapes).toHaveBeenCalledWith([]);

      mockSetShapes.mockClear();
      resetConfig.onPress([], mockSetShapes, null);
      expect(mockSetShapes).toHaveBeenCalledWith([]);
    });
  });

  describe("SHAPE_CONFIG", () => {
    it("has all three shape tools with type property and create function", () => {
      const tools = ["select", "arrow", "person"];
      expect(Object.keys(SHAPE_CONFIG)).toEqual(tools);
      
      tools.forEach((tool) => {
        const config = SHAPE_CONFIG[tool as keyof typeof SHAPE_CONFIG];
        expect(config.type).toBe(tool);
        expect(config.create).toBeInstanceOf(Function);
      });
    });

    it("select and arrow shapes return null on create", () => {
      const result1 = SHAPE_CONFIG.select.create({ id: "1", x: 10, y: 20 });
      expect(result1).toBeNull();

      const result2 = SHAPE_CONFIG.arrow.create({ id: "1", x: 10, y: 20 });
      expect(result2).toBeNull();
    });

    it("person shape creates correctly with various coordinate types", () => {
      const result1 = SHAPE_CONFIG.person.create({ id: "1", x: 10, y: 20 });
      expect(result1).toEqual({ id: "1", type: "person", x: 10, y: 20, size: 32 });

      const result2 = SHAPE_CONFIG.person.create({ id: "0", x: 0, y: 0 });
      expect(result2).toEqual({ id: "0", type: "person", x: 0, y: 0, size: 32 });

      const result3 = SHAPE_CONFIG.person.create({ id: "neg", x: -10, y: -20 });
      expect(result3).toEqual({ id: "neg", type: "person", x: -10, y: -20, size: 32 });

      const result4 = SHAPE_CONFIG.person.create({ id: "decimal", x: 10.5, y: 20.7 });
      expect(result4).toEqual({ id: "decimal", type: "person", x: 10.5, y: 20.7, size: 32 });
    });

    it("person shape preserves id exactly as provided", () => {
      const result = SHAPE_CONFIG.person.create({ id: "uuid-123-456", x: 10, y: 20 });
      expect(result?.id).toBe("uuid-123-456");
    });
  });
});