import { SHAPE_CONFIG } from "@/constants/playmaker";

describe("model.ts", () => {
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
      expect(result1).toEqual({
        id: "1",
        type: "person",
        x: 10,
        y: 20,
        size: 32,
      });

      const result2 = SHAPE_CONFIG.person.create({ id: "0", x: 0, y: 0 });
      expect(result2).toEqual({
        id: "0",
        type: "person",
        x: 0,
        y: 0,
        size: 32,
      });

      const result3 = SHAPE_CONFIG.person.create({ id: "neg", x: -10, y: -20 });
      expect(result3).toEqual({
        id: "neg",
        type: "person",
        x: -10,
        y: -20,
        size: 32,
      });

      const result4 = SHAPE_CONFIG.person.create({
        id: "decimal",
        x: 10.5,
        y: 20.7,
      });
      expect(result4).toEqual({
        id: "decimal",
        type: "person",
        x: 10.5,
        y: 20.7,
        size: 32,
      });
    });

    it("person shape preserves id exactly as provided", () => {
      const result = SHAPE_CONFIG.person.create({
        id: "uuid-123-456",
        x: 10,
        y: 20,
      });
      expect(result?.id).toBe("uuid-123-456");
    });
  });
});
