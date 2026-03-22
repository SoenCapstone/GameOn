import { buildStartEndIso, isToday, isValidTimeRange } from "@/utils/date";

describe("date utilities", () => {
  describe("isToday", () => {
    it("returns true for a date on the current day", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(isToday(today)).toBe(true);
    });

    it("returns false for a date on a previous day", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it("returns false for a date on a future day", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe("buildStartEndIso", () => {
    it("builds start and end iso values using the provided date and times", () => {
      const date = new Date(2026, 2, 18);
      const startTime = new Date(2026, 0, 1, 9, 30);
      const endTime = new Date(2026, 0, 1, 11, 15);

      const { startTime: startIso, endTime: endIso } = buildStartEndIso(
        date,
        startTime,
        endTime,
      );

      const start = new Date(startIso);
      const end = new Date(endIso);

      expect(start.getFullYear()).toBe(date.getFullYear());
      expect(start.getMonth()).toBe(date.getMonth());
      expect(start.getDate()).toBe(date.getDate());
      expect(start.getHours()).toBe(9);
      expect(start.getMinutes()).toBe(30);

      expect(end.getFullYear()).toBe(date.getFullYear());
      expect(end.getMonth()).toBe(date.getMonth());
      expect(end.getDate()).toBe(date.getDate());
      expect(end.getHours()).toBe(11);
      expect(end.getMinutes()).toBe(15);
    });
  });

  describe("isValidTimeRange", () => {
    it("returns true when end time is after start time", () => {
      const date = new Date("2026-03-18T00:00:00.000Z");
      const startTime = new Date("2026-01-01T09:00:00.000Z");
      const endTime = new Date("2026-01-01T10:00:00.000Z");

      expect(isValidTimeRange(date, startTime, endTime)).toBe(true);
    });

    it("returns false when end time equals start time", () => {
      const date = new Date("2026-03-18T00:00:00.000Z");
      const startTime = new Date("2026-01-01T09:00:00.000Z");
      const endTime = new Date("2026-01-01T09:00:00.000Z");

      expect(isValidTimeRange(date, startTime, endTime)).toBe(false);
    });

    it("returns false when end time is before start time", () => {
      const date = new Date("2026-03-18T00:00:00.000Z");
      const startTime = new Date("2026-01-01T10:00:00.000Z");
      const endTime = new Date("2026-01-01T09:00:00.000Z");

      expect(isValidTimeRange(date, startTime, endTime)).toBe(false);
    });
  });
});
