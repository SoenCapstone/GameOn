import {
  buildStartEndIso,
  formatLocalDateString,
  isToday,
  isValidTimeRange,
  parseDraftDate,
  toOffsetIsoString,
} from "@/utils/date";

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

  describe("parseDraftDate", () => {
    it("returns undefined when value is missing or invalid", () => {
      expect(parseDraftDate()).toBeUndefined();
      expect(parseDraftDate("not-a-date")).toBeUndefined();
    });

    it("returns a Date when the value is valid", () => {
      const parsed = parseDraftDate("2026-03-18T10:20:30.000Z");

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.toISOString()).toBe("2026-03-18T10:20:30.000Z");
    });
  });

  describe("formatLocalDateString", () => {
    it("formats local date parts with zero-padding", () => {
      const value = new Date(2026, 2, 5, 13, 45, 12);

      expect(formatLocalDateString(value)).toBe("2026-03-05");
    });
  });

  describe("toOffsetIsoString", () => {
    it("returns an ISO-like datetime with timezone offset and no milliseconds", () => {
      const value = new Date(2026, 2, 18, 9, 7, 5);
      const isoWithOffset = toOffsetIsoString(value);

      expect(isoWithOffset).toMatch(
        /^2026-03-18T09:07:05[+-]\d{2}:\d{2}$/,
      );
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
