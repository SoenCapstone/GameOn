import { formatFullName, getInitials } from "@/components/teams/member-row-utils";

describe("member-row-utils", () => {
  describe("formatFullName", () => {
    it("returns the trimmed full name when at least one name part exists", () => {
      expect(formatFullName("Alice", "Smith")).toBe("Alice Smith");
      expect(formatFullName("Alice", null)).toBe("Alice");
    });

    it("returns fallback when both names are empty", () => {
      expect(formatFullName("  ", "   ")).toBe("Unknown Player");
      expect(formatFullName(undefined, null)).toBe("Unknown Player");
    });
  });

  describe("getInitials", () => {
    it("uses first two words when name has at least two parts", () => {
      expect(getInitials("Alice Smith")).toBe("AS");
    });

    it("uses first letter when name has a single part", () => {
      expect(getInitials("alice")).toBe("A");
    });

    it("falls back to email initial when name is blank", () => {
      expect(getInitials("   ", "bob@gameon.com")).toBe("B");
    });

    it("returns question mark when neither name nor email provide initials", () => {
      expect(getInitials("   ", null)).toBe("?");
    });
  });
});