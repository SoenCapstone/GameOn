import { isToday } from "@/utils/date";

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
});
