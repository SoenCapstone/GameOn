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

  it("returns String(err) when Error has empty message", () => {
    const e = new Error();
    const out = errorToString(e);
    expect(out).toBe(String(e));
  });

  it("handles response.data.error field", () => {
    const err = {
      response: {
        data: { error: "invalid_grant" },
        status: 400,
      },
    } as any;
    expect(errorToString(err)).toBe("Request failed: invalid_grant");
  });

  it("handles response.data.error_description field", () => {
    const err = {
      response: {
        data: { error_description: "bad credentials" },
      },
    } as any;
    expect(errorToString(err)).toBe("Request failed: bad credentials");
  });

  it("falls back to numeric status when statusText absent", () => {
    const err = {
      response: {
        data: {},
        status: 404,
      },
    } as any;
    expect(errorToString(err)).toBe("Request failed: 404");
  });

  it("serializes non-string message objects via JSON.stringify", () => {
    const err = { message: { foo: 1 } } as any;
    expect(errorToString(err)).toBe(JSON.stringify(err));
  });

  it("falls back to String(err) when JSON.stringify fails (circular)", () => {
    const a: any = { foo: 1 };
    a.self = a;
    const out = errorToString(a);
    expect(out).toBe(String(a));
  });

});
