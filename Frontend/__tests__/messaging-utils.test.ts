import { validateMessageContent } from "@/features/messaging/utils";

describe("validateMessageContent", () => {
  it("rejects empty input", () => {
    const result = validateMessageContent("   ");
    expect(result.valid).toBe(false);
  });

  it("rejects oversized content", () => {
    const large = "a".repeat(2100);
    const result = validateMessageContent(large);
    expect(result.valid).toBe(false);
  });

  it("accepts trimmed messages", () => {
    const result = validateMessageContent("  hello  ");
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe("hello");
    }
  });
});
