import { errorToString } from "@/utils/error";

describe("errorToString", () => {
  it("returns message for Error instances", () => {
    expect(errorToString(new Error("boom"))).toBe("boom");
  });

  it("handles axios-like errors with response.data.message", () => {
    const err = {
      response: {
        data: { message: "Not allowed" },
        status: 401,
        statusText: "Unauthorized",
      },
    } as any;
    expect(errorToString(err)).toBe("Request failed: Not allowed");
  });

  it("falls back to statusText/status when response.data.message is absent", () => {
    const err = {
      response: {
        data: {},
        status: 500,
        statusText: "Server Error",
      },
    } as any;
    expect(errorToString(err)).toBe("Request failed: Server Error");
  });

  it("falls back to object.message for plain objects", () => {
    expect(errorToString({ message: "oops" })).toBe("oops");
  });

  it("converts primitives to strings", () => {
    expect(errorToString("raw")).toBe("raw");
    expect(errorToString(123)).toBe("123");
  });

  it("handles null/undefined as Unknown error", () => {
    expect(errorToString(null)).toBe("Unknown error");
    expect(errorToString(undefined)).toBe("Unknown error");
  });
});
